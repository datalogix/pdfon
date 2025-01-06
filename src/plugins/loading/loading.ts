import { Modal, ProgressBar } from '@/tools'
import { Plugin } from '../plugin'

export class LoadingPlugin extends Plugin {
  protected loading?: ProgressBar

  protected init() {
    this.on('documentopen', () => {
      this.loading = new ProgressBar()
      this.loading.onEnd = () => this.destroy()

      Modal.open(this.loading.render(), {
        persist: true,
      }).classList.add('modal-loading')
    })

    this.on('documentprogress', ({ loaded, total }) => {
      if (this.loading) {
        this.loading.total = total
        this.loading.value = loaded
      }
    })
  }

  protected destroy() {
    this.loading = undefined
    Modal.close()
  }
}
