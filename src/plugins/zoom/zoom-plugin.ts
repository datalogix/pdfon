import { normalizeWheelEventDirection } from '@/utils'
import { Plugin } from '../plugin'

export class ZoomPlugin extends Plugin {
  private onWheelListener = this.onWheel.bind(this)
  private onKeyDownListener = this.onKeyDown.bind(this)
  private onKeyUpListener = this.onKeyUp.bind(this)
  private onScrollListener = this.onScroll.bind(this)
  private onScrollEndListener = this.onScrollEnd.bind(this)
  private onTouchStartListener = this.onTouchStart.bind(this)
  private onTouchMoveListener = this.onTouchMove.bind(this)
  private onTouchEndListener = this.onTouchEnd.bind(this)
  private wheelUnusedTicks = 0
  private wheelUnusedFactor = 1
  private touchUnusedTicks = 0
  private touchUnusedFactor = 1
  private isCtrlKeyDown = false
  private isScrolling = false
  private touchInfo?: {
    touch0X: number
    touch0Y: number
    touch1X: number
    touch1Y: number
  }

  constructor(readonly supportsPinchToZoom = true) {
    super()
  }

  protected init() {
    window.addEventListener('keydown', this.onKeyDownListener, { signal: this.signal })
    window.addEventListener('keyup', this.onKeyUpListener, { signal: this.signal })
    this.container.addEventListener('wheel', this.onWheelListener, { passive: false, signal: this.signal })
    this.container.addEventListener('scroll', this.onScrollListener, { passive: true, signal: this.signal })
    this.container.addEventListener('touchstart', this.onTouchStartListener, { passive: false, signal: this.signal })
    this.container.addEventListener('touchmove', this.onTouchMoveListener, { passive: false, signal: this.signal })
    this.container.addEventListener('touchend', this.onTouchEndListener, { passive: false, signal: this.signal })
  }

  protected destroy() {
    window.removeEventListener('keydown', this.onKeyDownListener)
    window.removeEventListener('keyup', this.onKeyUpListener)
    this.container.removeEventListener('wheel', this.onWheelListener)
    this.container.removeEventListener('scroll', this.onScrollListener)
    this.container.removeEventListener('touchstart', this.onTouchStartListener)
    this.container.removeEventListener('touchmove', this.onTouchMoveListener)
    this.container.removeEventListener('touchend', this.onTouchEndListener)
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
    const isPinchToZoom
      = event.ctrlKey
      && !this.isCtrlKeyDown
      && deltaMode === WheelEvent.DOM_DELTA_PIXEL
      && event.deltaX === 0
      && (Math.abs(scaleFactor - 1) < 0.05)
      && event.deltaZ === 0

    const origin = [event.clientX, event.clientY]

    if (!(isPinchToZoom || event.ctrlKey || event.metaKey)) return

    event.preventDefault()

    if (
      this.isScrolling
      || document.visibilityState === 'hidden'
    //  // || this.overlayManager.active
    ) {
      return
    }

    if (isPinchToZoom && this.supportsPinchToZoom) {
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

  private onTouchStart(event: TouchEvent) {
    if (this.viewer.isInPresentationMode || event.touches.length < 2) {
      return
    }

    event.preventDefault()

    if (event.touches.length !== 2 /* || this.overlayManager.active */) {
      this.touchInfo = undefined
      return
    }

    let touch0 = event.touches[0]
    let touch1 = event.touches[1]

    if (touch0.identifier > touch1.identifier) {
      [touch0, touch1] = [touch1, touch0]
    }

    this.touchInfo = {
      touch0X: touch0.pageX,
      touch0Y: touch0.pageY,
      touch1X: touch1.pageX,
      touch1Y: touch1.pageY,
    }
  }

  private onTouchMove(event: TouchEvent) {
    if (!this.touchInfo || event.touches.length !== 2) {
      return
    }

    let touch0 = event.touches[0]
    let touch1 = event.touches[1]

    if (touch0.identifier > touch1.identifier) {
      [touch0, touch1] = [touch1, touch0]
    }

    const { pageX: page0X, pageY: page0Y } = touch0
    const { pageX: page1X, pageY: page1Y } = touch1

    const {
      touch0X: pTouch0X,
      touch0Y: pTouch0Y,
      touch1X: pTouch1X,
      touch1Y: pTouch1Y,
    } = this.touchInfo

    if (
      Math.abs(pTouch0X - page0X) <= 1
      && Math.abs(pTouch0Y - page0Y) <= 1
      && Math.abs(pTouch1X - page1X) <= 1
      && Math.abs(pTouch1Y - page1Y) <= 1
    ) {
      // Touches are really too close and it's hard do some basic
      // geometry in order to guess something.
      return
    }

    this.touchInfo.touch0X = page0X
    this.touchInfo.touch0Y = page0Y
    this.touchInfo.touch1X = page1X
    this.touchInfo.touch1Y = page1Y

    if (pTouch0X === page0X && pTouch0Y === page0Y) {
      // First touch is fixed, if the vectors are collinear then we've a pinch.
      const v1X = pTouch1X - page0X
      const v1Y = pTouch1Y - page0Y
      const v2X = page1X - page0X
      const v2Y = page1Y - page0Y
      const det = v1X * v2Y - v1Y * v2X
      // 0.02 is approximately sin(0.15deg).
      if (Math.abs(det) > 0.02 * Math.hypot(v1X, v1Y) * Math.hypot(v2X, v2Y)) {
        return
      }
    } else if (pTouch1X === page1X && pTouch1Y === page1Y) {
      // Second touch is fixed, if the vectors are collinear then we've a pinch.
      const v1X = pTouch0X - page1X
      const v1Y = pTouch0Y - page1Y
      const v2X = page0X - page1X
      const v2Y = page0Y - page1Y
      const det = v1X * v2Y - v1Y * v2X
      if (Math.abs(det) > 0.02 * Math.hypot(v1X, v1Y) * Math.hypot(v2X, v2Y)) {
        return
      }
    } else {
      const diff0X = page0X - pTouch0X
      const diff1X = page1X - pTouch1X
      const diff0Y = page0Y - pTouch0Y
      const diff1Y = page1Y - pTouch1Y
      const dotProduct = diff0X * diff1X + diff0Y * diff1Y
      if (dotProduct >= 0) {
        // The two touches go in almost the same direction.
        return
      }
    }

    event.preventDefault()

    const origin = [(page0X + page1X) / 2, (page0Y + page1Y) / 2]
    const distance = Math.hypot(page0X - page1X, page0Y - page1Y) || 1
    const pDistance = Math.hypot(pTouch0X - pTouch1X, pTouch0Y - pTouch1Y) || 1

    if (this.supportsPinchToZoom) {
      const newScaleFactor = this.accumulateFactor(this.viewer.currentScale, distance / pDistance, 'touchUnusedFactor')

      this.viewer.updateZoom({
        scaleFactor: newScaleFactor,
        steps: undefined,
        origin,
      })

      return
    }

    const PIXELS_PER_LINE_SCALE = 30
    const ticks = this.accumulateTicks((distance - pDistance) / PIXELS_PER_LINE_SCALE, 'touchUnusedTicks')

    this.viewer.updateZoom({
      scaleFactor: undefined,
      steps: ticks,
      origin,
    })
  }

  private onTouchEnd(event: TouchEvent) {
    if (!this.touchInfo) {
      return
    }

    event.preventDefault()

    this.touchInfo = undefined
    this.touchUnusedFactor = 1
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
