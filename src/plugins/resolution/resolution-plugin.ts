import { Plugin } from '../plugin'

export class ResolutionPlugin extends Plugin {
  private onChangeListener = this.onChange.bind(this)
  private mediaQueryList?: MediaQueryList

  protected init() {
    this.mediaQueryList = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`)
    this.onChangeListener()
  }

  protected destroy() {
    this.mediaQueryList?.removeEventListener('change', this.onChangeListener)
    this.mediaQueryList = undefined
  }

  private onChange(event?: MediaQueryListEvent) {
    if (event) this.viewer.refresh()

    this.mediaQueryList?.addEventListener('change', this.onChangeListener, { once: true, signal: this.signal })
  }
}
