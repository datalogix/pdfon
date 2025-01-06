import type { PrintAnnotationStorage } from '@/pdfjs'
import { dispatchEvent } from '@/utils'
import { Modal, ProgressBar } from '@/tools'
import type { ScriptingPlugin } from '../scripting'
import { Plugin, type ToolbarItemType } from '../plugin'
import { PrintService } from './print-service'
import { PrintToolbarItem } from './print-toolbar-item'

const print = window.print

export class PrintPlugin extends Plugin {
  protected getToolbarItems() {
    return new Map<string, ToolbarItemType>([
      ['print', PrintToolbarItem],
    ])
  }

  private printService?: PrintService
  private printAnnotationStoragePromise?: Promise<PrintAnnotationStorage | undefined>

  constructor(readonly resolution = 150) {
    super()
  }

  get scriptingManager() {
    return this.viewer.getLayerProperty<ScriptingPlugin>('ScriptingPlugin')?.scriptingManager
  }

  get supportsPrinting() {
    return true
  }

  protected init() {
    this.on('beforeprint', () => this.onBeforePrint())
    this.on('afterprint', () => this.onAfterPrint())
    this.on('print', () => this.triggerPrint())

    if ('onbeforeprint' in window) {
      // Do not propagate before/afterprint events when they are not triggered
      // from within this polyfill. (FF / Chrome 63+).
      const stopPropagationIfNeeded = (e: Event) => {
        if ((e as CustomEvent).detail !== 'custom') {
          e.stopImmediatePropagation()
        }
      }
      window.addEventListener('beforeprint', stopPropagationIfNeeded, { signal: this.signal })
      window.addEventListener('afterprint', stopPropagationIfNeeded, { signal: this.signal })
    }

    window.addEventListener('beforeprint', () => this.dispatch('beforeprint'), { signal: this.signal })
    window.addEventListener('afterprint', () => this.dispatch('afterprint'), { signal: this.signal })
    window.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'p' && (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey) {
        this.triggerPrint()

        e.preventDefault()
        e.stopImmediatePropagation()
      }
    }, {
      capture: true,
      signal: this.signal,
    })

    this.setupAutoPrint()
    window.print = () => this.triggerPrint()
  }

  protected destroy() {
    this.printService?.destroy()
    this.printService = undefined
    window.print = print
  }

  triggerPrint() {
    if (!this.supportsPrinting) {
      this.dispatch('notify', { type: 'warn', key: 'print.not-supported' })
      return
    }

    if (this.viewer.renderingQueue.printing) {
      return
    }

    try {
      dispatchEvent('beforeprint')
    } finally {
      this.printService?.print(print).then(() => {
        dispatchEvent('afterprint')
      })
    }
  }

  private onBeforePrint() {
    this.printAnnotationStoragePromise = this.scriptingManager?.dispatchWillPrint()
      .catch(() => {})
      .then(() => this.pdfDocument?.annotationStorage.print)

    if (!this.pdfDocument) {
      return
    }

    if (this.printService) {
      // There is no way to suppress beforePrint/afterPrint events,
      // but PDFPrintService may generate double events -- this will ignore
      // the second event that will be coming from native window.print().
      return
    }

    // The beforePrint is a sync method and we need to know layout before
    // returning from this method. Ensure that we can get sizes of the pages.
    if (!this.viewer.pagesReady) {
      this.dispatch('notify', { type: 'warn', key: 'print.not-ready' })
      return
    }

    this.printService = new PrintService(
      this.pdfDocument,
      this.viewer.getPagesOverview(),
      this.resolution,
      this.printAnnotationStoragePromise,
    )

    const progressBar = new ProgressBar()
    progressBar.onEnd = () => Modal.close()

    Modal.open(progressBar.render(), {
      persist: true,
    }).classList.add('modal-printing')

    this.viewer.renderingQueue.startPrinting()
    this.viewer.forceRendering()
    this.printService.layout()
    this.printService.onRenderProgress((index, total) => {
      progressBar.total = total
      progressBar.value = index
    })
  }

  private onAfterPrint() {
    this.printAnnotationStoragePromise?.then(() => this.scriptingManager?.dispatchDidPrint())
    this.printAnnotationStoragePromise = undefined

    this.printService?.destroy()
    this.printService = undefined

    this.pdfDocument?.annotationStorage.resetModified()
    this.viewer.renderingQueue.stopPrinting()
    this.viewer.forceRendering()
  }

  private setupAutoPrint() {
    this.viewer.pagesManager.pagesPromise?.then(async () => {
      const [openAction, jsActions] = await Promise.all([
        this.pdfDocument?.getOpenAction().catch(() => {}),
        this.scriptingManager ? null : this.pdfDocument?.getJSActions(),
      ])

      let triggerAutoPrint = openAction?.action === 'Print'

      if (jsActions) {
        this.logger.warn('Warning: JavaScript support is not enabled')

        // Hack to support auto printing.
        for (const name in jsActions) {
          if (triggerAutoPrint) {
            break
          }

          switch (name) {
            case 'WillClose':
            case 'WillSave':
            case 'DidSave':
            case 'WillPrint':
            case 'DidPrint':
              continue
          }

          triggerAutoPrint = (jsActions as any)[name].some((js: string) => /\bprint\s*\(/.test(js))
        }
      }

      if (triggerAutoPrint) {
        this.triggerPrint()
      }
    },
    (reason) => {
      this.dispatch('notify', { type: 'error', key: 'error.loading', info: reason })
    })
  }
}
