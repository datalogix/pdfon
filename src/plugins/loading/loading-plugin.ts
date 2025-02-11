import { Plugin } from '../plugin'
import { LoadingService } from './loading-service'

export class LoadingPlugin extends Plugin {
  private loadingService?: LoadingService

  protected init() {
    this.loadingService = new LoadingService(this.translator)
    this.loadingService.render(this.rootContainer)

    this.on('DocumentOpen', () => this.loadingService?.init())
    this.on('DocumentProgress', ({ loaded, total }) => this.loadingService?.update(loaded, total))
    this.on('DocumentLoaded', () => this.loadingService?.finish())
    this.on(['DocumentInitialized', 'DocumentError', 'DocumentEmpty'], () => this.loadingService?.complete())
  }

  protected destroy() {
    this.loadingService?.destroy()
    this.loadingService = undefined
  }
}
