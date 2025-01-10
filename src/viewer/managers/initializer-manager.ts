import type { PDFDocumentProxy } from '@/pdfjs'
import { FORCE_PAGES_LOADED_TIMEOUT } from '@/config'
import { isEmbedded } from '@/utils'
import * as initializers from '../initializers'
import type { ViewerType } from '../types'
import { Manager, type ScrollDestination } from './'

export class InitializerManager extends Manager {
  private _initialized = false
  private initializers: initializers.Initializer[] = [
    new initializers.AnimationInitializer(),
    new initializers.DocumentInitializer(),
  ]

  get initialized() {
    return this._initialized
  }

  addInitializer(initializer: initializers.Initializer) {
    this.initializers.push(initializer)
  }

  removeInitializer(initializer: initializers.Initializer) {
    this.initializers.splice(this.initializers.findIndex(value => value === initializer), 1)
  }

  init() {
    this.on('documentinit', ({ pdfDocument }) => this.setupInitializer(pdfDocument))
    this.on('documentinitialized', () => {
      this._initialized = true
    })
  }

  reset() {
    this._initialized = false
  }

  private setupInitializer(pdfDocument: PDFDocumentProxy) {
    this.applyInitializers(pdfDocument)
      .then(options => this.setInitialView(options))
      .then(async () => {
        // Make all navigation keys work on document load,
        // unless the viewer is embedded in a web page.
        if (!isEmbedded()) {
          this.containerManager.focus()
        }

        // For documents with different page sizes, once all pages are
        // resolved, ensure that the correct location becomes visible on load.
        // (To reduce the risk, in very large and/or slow loading documents,
        //  that the location changes *after* the user has started interacting
        //  with the viewer, wait for either `pagesPromise` or a timeout.)
        await Promise.race([
          this.pagesManager.pagesPromise,
          new Promise(resolve => setTimeout(resolve, FORCE_PAGES_LOADED_TIMEOUT)),
        ])
      })
      .catch(() => this.setInitialView())
      .finally(() => this.viewer.update())
  }

  private async applyInitializers(pdfDocument: PDFDocumentProxy) {
    let options: initializers.InitializerOptions = {}
    const initializers = this.initializers.sort((a, b) => b.priority - a.priority)

    for (const initializer of initializers) {
      try {
        options = await initializer.apply({
          pdfDocument,
          viewer: this.viewer as ViewerType,
          options,
        })
      } catch (reason) {
        this.logger.error(`Unable to load initializer`, reason)
      }
    }

    return options
  }

  private setInitialView(options?: initializers.InitializerOptions) {
    queueMicrotask(async () => {
      if (options?.scroll) this.scrollManager.scrollMode = options.scroll
      if (options?.spread) this.spreadManager.spreadMode = options.spread
      if (options?.rotation) this.rotationManager.rotation = options.rotation

      if (options?.sidebar) {
        queueMicrotask(() => this.dispatch('sidebarselect', {
          key: options?.sidebar,
          open: options?.sidebaropened,
        }))
      }

      if (options?.scale && !options.scale.toString().toLowerCase().includes('fit')) {
        this.scrollManager.scrollPageIntoView({
          pageNumber: options?.page ?? 1,
          destination: [
            'XYZ',
            options.scrollLeft ?? 0,
            options.scrollTop ?? 0,
            typeof options.scale === 'number' ? options.scale / 100 : options.scale,
          ],
          allowNegativeOffset: true,
        })
      } else if (options?.scale) {
        this.scrollManager.scrollPageIntoView({
          pageNumber: options?.page ?? 1,
          destination: [
            options.scale,
            options.scrollLeft ?? 0,
            options.scrollTop ?? 0,
          ] as any as ScrollDestination,
          allowNegativeOffset: true,
        })
      } else if (options?.page) {
        this.pagesManager.currentPageNumber = options.page
      }

      this.dispatch('documentinitialized', { options })
    })
  }
}
