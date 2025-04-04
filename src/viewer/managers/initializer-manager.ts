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

  get initializersOrdered() {
    return this.initializers.sort((a, b) => a.order - b.order)
  }

  addInitializer(initializer: Initializer) {
    this.initializers.push(initializer)
  }

  removeInitializer(initializer: Initializer) {
    this.initializers.splice(this.initializers.findIndex(value => value === initializer), 1)
  }

  init() {
    this.on('DocumentInit', async ({ options }) => await this.setupInitializer(options))
    this.on('DocumentInitialView', async ({ options }) => await this.executeInitializers(options))
    this.on('DocumentInitialized', async ({ options }) => await this.finishInitializers(options))
  }

  reset() {
    this._initialized = false
  }

  private async setupInitializer(options: InitializerOptions = {}) {
    try {
      this.applyInitialView({
        ...await this.prepareInitializers(),
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

  private async prepareInitializers() {
    let options: InitializerOptions = {}

    for (const initializer of this.initializersOrdered) {
      try {
        initializer.setViewer(this.viewer as ViewerType)
        options = await initializer.prepare(options)
      } catch (reason) {
        this.logger.error(`Unable to prepare initializer`, reason)
      }
    }

    return options
  }

  private async executeInitializers(options: InitializerOptions) {
    await Promise.allSettled(this.initializersOrdered.map(initializer => initializer.execute(options)))
    this._initialized = true
    this.dispatch('DocumentInitialized', { options })
  }

  private async finishInitializers(options: InitializerOptions) {
    await Promise.allSettled(this.initializersOrdered.map(initializer => initializer.finish(options)))
  }
}
