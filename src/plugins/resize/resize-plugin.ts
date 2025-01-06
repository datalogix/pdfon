import { Plugin } from '../plugin'

export class ResizePlugin extends Plugin {
  private onResizeListener = this.onResize.bind(this)

  protected init() {
    window.addEventListener('resize', this.onResizeListener, { signal: this.signal })
  }

  protected destroy() {
    window.removeEventListener('resize', this.onResizeListener)
  }

  private onResize(_event: UIEvent) {
    if (this.viewer.renderManager.renderingQueue.printing && window.matchMedia('print').matches) {
      // Work-around issue 15324 by ignoring 'resize' events during printing.
      return
    }

    const currentScaleValue = this.viewer.currentScaleValue

    if (
      currentScaleValue === 'auto'
      || currentScaleValue === 'page-fit'
      || currentScaleValue === 'page-width'
    ) {
      this.viewer.currentScaleValue = currentScaleValue
    }

    this.viewer.update()
  }
}
