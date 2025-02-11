import type { PDFDocumentProxy } from '@/pdfjs'
import { FORCE_PAGES_LOADED_TIMEOUT } from '@/config'
import { isEmbedded } from '@/utils'
import { AnimationInitializer, DocumentInitializer, type Initializer, type InitializerOptions } from '../initializers'
import type { ViewerType } from '../types'
import { Manager, type ScrollDestination } from './'

export class InitializerManager extends Manager {
  private _initialized = false
  private initializers: Initializer[] = [
    new AnimationInitializer(),
    new DocumentInitializer(),
  ]

  get initialized() {
    return this._initialized
  }

  addInitializer(initializer: Initializer) {
    this.initializers.push(initializer)
  }

  removeInitializer(initializer: Initializer) {
    this.initializers.splice(this.initializers.findIndex(value => value === initializer), 1)
  }

  init() {
    this.on('DocumentInit', async ({ pdfDocument, options }) => await this.setupInitializer(pdfDocument, options))
    this.on('DocumentInitialView', async ({ options }) => await this.executeInitializers(options))
  }

  reset() {
    this._initialized = false
  }

  private async setupInitializer(pdfDocument: PDFDocumentProxy, options: InitializerOptions = {}) {
    try {
      this.applyInitialView({
        ...await this.prepareInitializers(pdfDocument),
        ...options,
      })

      if (!isEmbedded()) {
        this.containerManager.focus()
      }

      await Promise.race([
        this.pagesManager.pagesPromise,
        new Promise(resolve => setTimeout(resolve, FORCE_PAGES_LOADED_TIMEOUT)),
      ])
    } catch {
      this.applyInitialView(options)
    } finally {
      this.viewer.update()
      this.dispatch('DocumentInitialized')
    }
  }

  private applyInitialView(options: InitializerOptions = {}) {
    queueMicrotask(() => {
      if (options.scroll) this.scrollManager.scrollMode = options.scroll
      if (options.spread) this.spreadManager.spreadMode = options.spread
      if (options.rotation) this.rotationManager.rotation = options.rotation

      if (options.scale && !options.scale.toString().toLowerCase().includes('fit')) {
        this.scrollManager.scrollPageIntoView({
          pageNumber: options.page ?? 1,
          destination: [
            'XYZ',
            options.scrollLeft ?? 0,
            options.scrollTop ?? 0,
            typeof options.scale === 'number' ? options.scale / 100 : options.scale,
          ],
          allowNegativeOffset: true,
        })
      } else if (options.scale) {
        this.scrollManager.scrollPageIntoView({
          pageNumber: options.page ?? 1,
          destination: [
            options.scale,
            options.scrollLeft ?? 0,
            options.scrollTop ?? 0,
          ] as any as ScrollDestination,
          allowNegativeOffset: true,
        })
      } else if (options.page) {
        this.pagesManager.currentPageNumber = options.page
      }

      this.dispatch('DocumentInitialView', { options })
    })
  }

  private async prepareInitializers(pdfDocument: PDFDocumentProxy) {
    let options: InitializerOptions = {}
    const initializers = this.initializers.sort((a, b) => b.priority - a.priority)

    for (const initializer of initializers) {
      try {
        initializer.init(pdfDocument, this.viewer as ViewerType)
        options = await initializer.prepare(options)
      } catch (reason) {
        this.logger.error(`Unable to prepare initializer`, reason)
      }
    }

    return options
  }

  private async executeInitializers(options: InitializerOptions) {
    const initializers = this.initializers.sort((a, b) => b.priority - a.priority)
    const handlers: ((options: InitializerOptions) => void)[] = []

    for (const initializer of initializers) {
      try {
        const handler = await initializer.execute(options)
        if (handler) {
          handlers.push(handler)
        }
      } catch (reason) {
        this.logger.error(`Unable to execute initializer`, reason)
      }
    }

    this.on('DocumentInitialized', async () => {
      handlers.forEach(handler => handler(options))
      await this.finishInitializers(options)
      this._initialized = true
    })
  }

  private async finishInitializers(options: InitializerOptions) {
    const initializers = this.initializers.sort((a, b) => b.priority - a.priority)

    for (const initializer of initializers) {
      try {
        await initializer.finish(options)
      } catch (reason) {
        this.logger.error(`Unable to execute initializer`, reason)
      }
    }
  }
}
