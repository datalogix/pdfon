import { Plugin } from '../plugin'
import { LoadingService } from './loading-service'

export class LoadingPlugin extends Plugin {
  private loadingService?: LoadingService

  protected init() {
    this.loadingService = new LoadingService(this.rootContainer, this.l10n)

    this.on('documentopen', () => this.loadingService?.init())
    this.on('documentprogress', ({ loaded, total }) => {
      console.log(loaded, total)
      console.log(typeof loaded, typeof total)
      this.loadingService?.update(parseInt(loaded, 0), parseInt(total, 0))
    })
    this.on('documentloaded', () => this.loadingService?.finish())
    this.on(['documentinitialized', 'documenterror', 'documentempty'], () => this.loadingService?.complete())
  }

  protected destroy() {
    this.loadingService?.destroy()
    this.loadingService = undefined
  }
}
