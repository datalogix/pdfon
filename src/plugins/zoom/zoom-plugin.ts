import { normalizeWheelEventDirection } from '@/utils'
import { Plugin } from '../plugin'
import { ZoomTouchManager } from './zoom-touch-manager'

export class ZoomPlugin extends Plugin {
  private zoomTouchManager?: ZoomTouchManager
  private onWheelListener = this.onWheel.bind(this)
  private onKeyDownListener = this.onKeyDown.bind(this)
  private onKeyUpListener = this.onKeyUp.bind(this)
  private onScrollListener = this.onScroll.bind(this)
  private onScrollEndListener = this.onScrollEnd.bind(this)
  private wheelUnusedTicks = 0
  private wheelUnusedFactor = 1
  private touchUnusedTicks = 0
  private touchUnusedFactor = 1
  private isCtrlKeyDown = false
  private isScrolling = false

  get container() {
    return this.viewer.container
  }

  protected init() {
    this.zoomTouchManager = new ZoomTouchManager({
      container: this.container,
      isPinchingDisabled: () => this.viewer.isInPresentationMode,
      onPinching: this.onPinching.bind(this),
      onPinchEnd: this.onPinchEnd.bind(this),
      signal: this.signal,
    })

    window.addEventListener('keydown', this.onKeyDownListener, { signal: this.signal })
    window.addEventListener('keyup', this.onKeyUpListener, { signal: this.signal })
    this.container.addEventListener('wheel', this.onWheelListener, { passive: false, signal: this.signal })
    this.container.addEventListener('scroll', this.onScrollListener, { passive: true, signal: this.signal })
  }

  protected destroy() {
    window.removeEventListener('keydown', this.onKeyDownListener)
    window.removeEventListener('keyup', this.onKeyUpListener)
    this.container.removeEventListener('wheel', this.onWheelListener)
    this.container.removeEventListener('scroll', this.onScrollListener)

    this.zoomTouchManager?.destroy()
    this.zoomTouchManager = undefined
  }

  private onPinching(origin: number[], prevDistance: number, distance: number) {
    if (this.options.supportsPinchToZoom ?? true) {
      const newScaleFactor = this.accumulateFactor(this.viewer.currentScale, distance / prevDistance, 'touchUnusedFactor')

      this.viewer.updateZoom({
        scaleFactor: newScaleFactor,
        steps: undefined,
        origin,
      })

      return
    }

    const PIXELS_PER_LINE_SCALE = 30
    const ticks = this.accumulateTicks((distance - prevDistance) / PIXELS_PER_LINE_SCALE, 'touchUnusedTicks')

    this.viewer.updateZoom({
      scaleFactor: undefined,
      steps: ticks,
      origin,
    })
  }

  private onPinchEnd() {
    this.touchUnusedTicks = 0
    this.touchUnusedFactor = 1
  }

  private onKeyUp(event: KeyboardEvent) {
    if (event.key === 'Control' || event.key === 'Meta') {
      this.isCtrlKeyDown = false
    }
  }

  private onKeyDown(event: KeyboardEvent) {
    this.isCtrlKeyDown = event.key === 'Control' || event.key === 'Meta'
  }

  private onScrollEnd() {
    this.isScrolling = false
    this.container.addEventListener('scroll', this.onScrollListener, { passive: true, signal: this.signal })
    this.container.removeEventListener('scrollend', this.onScrollEndListener)
    this.container.removeEventListener('blur', this.onScrollEndListener)
  }

  private onScroll(_event: Event) {
    if (this.isCtrlKeyDown || this.container.offsetHeight >= this.container.scrollHeight) {
      return
    }

    this.container.removeEventListener('scroll', this.onScrollListener)
    this.isScrolling = true
    this.container.addEventListener('scrollend', this.onScrollEndListener, { signal: this.signal })
    this.container.addEventListener('blur', this.onScrollEndListener, { signal: this.signal })
  }

  private onWheel(event: WheelEvent) {
    if (this.viewer.isInPresentationMode) {
      return
    }

    const deltaMode = event.deltaMode

    let scaleFactor = Math.exp(-event.deltaY / 100)
    const isPinchToZoom = event.ctrlKey
      && !this.isCtrlKeyDown
      && deltaMode === WheelEvent.DOM_DELTA_PIXEL
      && event.deltaX === 0
      && (Math.abs(scaleFactor - 1) < 0.05)
      && event.deltaZ === 0

    const origin = [event.clientX, event.clientY]

    if (!(isPinchToZoom || event.ctrlKey || event.metaKey)) return

    event.preventDefault()

    if (this.isScrolling || document.visibilityState === 'hidden') {
      return
    }

    if (isPinchToZoom && (this.options.supportsPinchToZoom ?? true)) {
      scaleFactor = this.accumulateFactor(
        this.viewer.currentScale,
        scaleFactor,
        'wheelUnusedFactor',
      )

      this.viewer.updateZoom({
        scaleFactor,
        steps: undefined,
        origin,
      })

      return
    }

    const delta = normalizeWheelEventDirection(event)

    let ticks = 0

    if (deltaMode === WheelEvent.DOM_DELTA_LINE || deltaMode === WheelEvent.DOM_DELTA_PAGE) {
      ticks = Math.abs(delta) >= 1 ? Math.sign(delta) : this.accumulateTicks(delta, 'wheelUnusedTicks')
    } else {
      const PIXELS_PER_LINE_SCALE = 30
      ticks = this.accumulateTicks(delta / PIXELS_PER_LINE_SCALE, 'wheelUnusedTicks')
    }

    this.viewer.updateZoom({
      scaleFactor: undefined,
      steps: ticks,
      origin,
    })
  }

  private accumulateFactor(previousScale: number, factor: number, prop: 'wheelUnusedFactor' | 'touchUnusedFactor') {
    if (factor === 1) {
      return 1
    }

    if ((this[prop] > 1 && factor < 1) || (this[prop] < 1 && factor > 1)) {
      this[prop] = 1
    }

    const newFactor = Math.floor(previousScale * factor * this[prop] * 100) / (100 * previousScale)
    this[prop] = factor / newFactor

    return newFactor
  }

  private accumulateTicks(ticks: number, prop: 'wheelUnusedTicks' | 'touchUnusedTicks') {
    if ((this[prop] > 0 && ticks < 0) || (this[prop] < 0 && ticks > 0)) {
      this[prop] = 0
    }

    this[prop] += ticks
    const wholeTicks = Math.trunc(this[prop])
    this[prop] -= wholeTicks

    return wholeTicks
  }
}
