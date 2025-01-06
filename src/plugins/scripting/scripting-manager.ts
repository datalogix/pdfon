import { PDFDocumentProxy } from '@/pdfjs'
import { Dispatcher } from '@/bus'
import { RenderingStates } from '@/enums'
import { apiPageLayoutToViewerModes } from '@/utils'
import type { ViewerType } from '@/viewer'
import { Scripting } from './scripting'

export class ScriptingManager extends Dispatcher {
  private closeCapability?: PromiseWithResolvers<void>
  private destroyCapability?: PromiseWithResolvers<void>
  private eventAbortController?: AbortController
  private pdfDocument?: PDFDocumentProxy
  private _ready = false
  private scripting?: Scripting
  private willPrintCapability?: PromiseWithResolvers<void>
  private pageOpenPending = new Set()
  private visitedPages = new Map()

  constructor(protected readonly viewer: ViewerType) {
    super()

    window.addEventListener('updatefromsandbox', (e) => {
      this.dispatch('updatefromsandbox', {
        source: window,
        detail: (e as CustomEvent).detail,
      })
    }, { signal: this.signal })
  }

  get eventBus() {
    return this.viewer.eventBus
  }

  get signal() {
    return this.eventAbortController?.signal
  }

  async setDocument(pdfDocument?: PDFDocumentProxy) {
    if (this.pdfDocument) {
      await this.destroyScripting()
    }

    this.pdfDocument = pdfDocument

    if (!pdfDocument) {
      return
    }

    const [objects, calculationOrder, docActions] = await Promise.all([
      pdfDocument.getFieldObjects(),
      pdfDocument.getCalculationOrderIds(),
      pdfDocument.getJSActions(),
    ])

    if (!objects && !docActions) {
      await this.destroyScripting()
      return
    }

    if (pdfDocument !== this.pdfDocument) {
      return
    }

    try {
      this.scripting = this.initScripting()
    } catch (ex) {
      console.error(`setDocument: "${ex}".`)

      await this.destroyScripting()
      return
    }

    this.eventAbortController = new AbortController()

    this.on('updatefromsandbox', (e) => {
      if (e?.source === window) {
        this.updateFromSandbox(e.detail)
      }
    })

    this.on('dispatcheventinsandbox', (e) => {
      this.scripting?.dispatchEventInSandbox(e.detail)
    })

    this.on('pagechanging', ({ pageNumber, previous }) => {
      if (pageNumber === previous) {
        return
      }

      this.dispatchPageClose(previous)
      this.dispatchPageOpen(pageNumber)
    })

    this.on('pagerendered', ({ pageNumber }) => {
      if (!this.pageOpenPending.has(pageNumber)) {
        return
      }

      if (pageNumber !== this.viewer.currentPageNumber) {
        return
      }

      this.dispatchPageOpen(pageNumber)
    })

    this.on('pagesdestroy', async () => {
      await this.dispatchPageClose(this.viewer.currentPageNumber)

      await this.scripting?.dispatchEventInSandbox({
        id: 'doc',
        name: 'WillClose',
      })

      this.closeCapability?.resolve()
    })

    try {
      if (pdfDocument !== this.pdfDocument) {
        return
      }

      await this.scripting.createSandbox({
        objects,
        calculationOrder,
        appInfo: {
          platform: navigator.userAgent,
          language: navigator.language,
        },
        docInfo: {
          ...this.viewer.documentInfo,
          baseURL: this.viewer.baseUrl,
          filesize: this.viewer.documentFilesize,
          filename: this.viewer.documentFilename,
          metadata: this.viewer.documentMetadata?.getRaw(),
          authors: this.viewer.documentMetadata?.get('dc:creator'),
          numPages: this.viewer.pagesCount,
          URL: this.viewer.documentUrl,
          actions: docActions,
        },
      })

      this.dispatch('sandboxcreated')
    } catch (ex) {
      console.error(`setDocument: "${ex}".`)

      await this.destroyScripting()
      return
    }

    await this.scripting?.dispatchEventInSandbox({
      id: 'doc',
      name: 'Open',
    })

    await this.dispatchPageOpen(
      this.viewer.currentPageNumber,
      true,
    )

    Promise.resolve().then(() => {
      if (pdfDocument === this.pdfDocument) {
        this._ready = true
      }
    })
  }

  async dispatchWillSave() {
    return this.scripting?.dispatchEventInSandbox({
      id: 'doc',
      name: 'WillSave',
    })
  }

  async dispatchDidSave() {
    return this.scripting?.dispatchEventInSandbox({
      id: 'doc',
      name: 'DidSave',
    })
  }

  async dispatchWillPrint() {
    if (!this.scripting) {
      return
    }

    await this.willPrintCapability?.promise

    this.willPrintCapability = Promise.withResolvers()

    try {
      await this.scripting.dispatchEventInSandbox({
        id: 'doc',
        name: 'WillPrint',
      })
    } catch (ex) {
      this.willPrintCapability.resolve()
      this.willPrintCapability = undefined
      throw ex
    }

    await this.willPrintCapability.promise
  }

  async dispatchDidPrint() {
    return this.scripting?.dispatchEventInSandbox({
      id: 'doc',
      name: 'DidPrint',
    })
  }

  get destroyPromise() {
    return this.destroyCapability?.promise || null
  }

  get ready() {
    return this._ready
  }

  private async updateFromSandbox(detail: any) {
    const isInPresentationMode = this.viewer.isInPresentationMode || this.viewer.isChangingPresentationMode

    const { id, siblings, command, value } = detail

    if (!id) {
      switch (command) {
        case 'clear':
          console.clear()
          break
        case 'error':
          console.error(value)
          break
        case 'layout':
          if (!isInPresentationMode) {
            const modes = apiPageLayoutToViewerModes(value)
            this.viewer.spreadMode = modes.spreadMode
          }
          break
        case 'page-num':
          this.viewer.currentPageNumber = value + 1
          break
        case 'print':
          await this.viewer.pagesPromise
          this.dispatch('print')
          break
        case 'println':
          console.log(value)
          break
        case 'zoom':
          if (!isInPresentationMode) {
            this.viewer.currentScaleValue = value
          }
          break
        case 'SaveAs':
          this.dispatch('download')
          break
        case 'FirstPage':
          this.viewer.currentPageNumber = 1
          break
        case 'LastPage':
          this.viewer.currentPageNumber = this.viewer.pagesCount
          break
        case 'NextPage':
          this.viewer.nextPage()
          break
        case 'PrevPage':
          this.viewer.previousPage()
          break
        case 'ZoomViewIn':
          if (!isInPresentationMode) {
            this.viewer.increaseScale()
          }
          break
        case 'ZoomViewOut':
          if (!isInPresentationMode) {
            this.viewer.decreaseScale()
          }
          break
        case 'WillPrintFinished':
          this.willPrintCapability?.resolve()
          this.willPrintCapability = undefined
          break
      }
      return
    }

    if (isInPresentationMode && detail.focus) {
      return
    }

    delete detail.id
    delete detail.siblings

    const ids = siblings ? [id, ...siblings] : [id]
    for (const elementId of ids) {
      const element = document.querySelector(
        `[data-element-id="${elementId}"]`,
      )
      if (element) {
        element.dispatchEvent(new CustomEvent('updatefromsandbox', { detail }))
      } else {
        this.pdfDocument?.annotationStorage.setValue(elementId, detail)
      }
    }
  }

  private async dispatchPageOpen(pageNumber: number, initialize?: boolean) {
    const pdfDocument = this.pdfDocument
    const visitedPages = this.visitedPages

    if (initialize) {
      this.closeCapability = Promise.withResolvers()
    }

    if (!this.closeCapability) {
      return
    }

    const pageView = this.viewer.getPage(pageNumber - 1)

    if (pageView?.renderingState !== RenderingStates.FINISHED) {
      this.pageOpenPending.add(pageNumber)
      return
    }

    this.pageOpenPending.delete(pageNumber)

    const actionsPromise = (async () => {
      const actions = await (!visitedPages.has(pageNumber)
        ? pageView.pdfPage?.getJSActions()
        : null)

      if (pdfDocument !== this.pdfDocument) {
        return
      }

      await this.scripting?.dispatchEventInSandbox({
        id: 'page',
        name: 'PageOpen',
        pageNumber,
        actions,
      })
    })()

    visitedPages.set(pageNumber, actionsPromise)
  }

  private async dispatchPageClose(pageNumber: number) {
    const pdfDocument = this.pdfDocument

    if (!this.closeCapability) {
      return
    }

    if (this.pageOpenPending.has(pageNumber)) {
      return
    }

    const actionsPromise = this.visitedPages.get(pageNumber)
    if (!actionsPromise) {
      return
    }

    this.visitedPages.set(pageNumber, null)

    await actionsPromise

    if (pdfDocument !== this.pdfDocument) {
      return
    }

    await this.scripting?.dispatchEventInSandbox({
      id: 'page',
      name: 'PageClose',
      pageNumber,
    })
  }

  private initScripting() {
    this.destroyCapability = Promise.withResolvers()

    if (this.scripting) {
      throw new Error('initScripting: Scripting already exists.')
    }

    return new Scripting()
  }

  private async destroyScripting() {
    if (!this.scripting) {
      this.pdfDocument = undefined
      this.destroyCapability?.resolve()
      return
    }

    if (this.closeCapability) {
      await Promise.race([
        this.closeCapability.promise,
        new Promise(resolve => setTimeout(resolve, 1000)),
      ]).catch(() => {})

      this.closeCapability = undefined
    }

    this.pdfDocument = undefined

    try {
      await this.scripting.destroySandbox()
    } catch {
      //
    }

    this.willPrintCapability?.reject(new Error('Scripting destroyed.'))
    this.willPrintCapability = undefined

    this.eventAbortController?.abort()
    this.eventAbortController = undefined

    this.pageOpenPending.clear()
    this.visitedPages.clear()

    this.scripting = undefined
    this._ready = false

    this.destroyCapability?.resolve()
  }
}
