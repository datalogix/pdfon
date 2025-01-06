import { AnnotationEditorType } from '@/pdfjs'
import { PresentationModeState, ScrollMode, SpreadMode } from '@/enums'
import type { ViewerType } from '@/viewer'
import { normalizeWheelEventDelta } from '@/utils'

const DELAY_BEFORE_HIDING_CONTROLS = 3000
const ACTIVE_SELECTOR = 'presentation-mode'
const CONTROLS_SELECTOR = 'presentation-mode-controls'
const MOUSE_SCROLL_COOLDOWN_TIME = 50
const PAGE_SWITCH_THRESHOLD = 0.1
const SWIPE_MIN_DISTANCE_THRESHOLD = 50
const SWIPE_ANGLE_THRESHOLD = Math.PI / 6

export class PresentationService {
  private state = PresentationModeState.UNKNOWN
  private args?: {
    pageNumber: number
    scaleValue?: string
    scrollMode: ScrollMode
    spreadMode?: SpreadMode
    annotationEditorMode?: number
  }

  private controlsTimeout?: NodeJS.Timeout
  private fullscreenChangeAbortController?: AbortController
  private windowAbortController?: AbortController
  private contextMenuOpen = false
  private mouseScrollTimeStamp = 0
  private mouseScrollDelta = 0
  private touchSwipeState?: {
    startX: number
    startY: number
    endX: number
    endY: number
  }

  constructor(protected readonly viewer: ViewerType) {
    //
  }

  get container() {
    return this.viewer.container
  }

  get supported() {
    return this.container.ownerDocument.fullscreenEnabled
  }

  reset() {
    this.removeFullscreenChangeListeners()
    this.removeWindowListeners()
    this.hideControls()
    this.resetMouseScrollState()
    this.contextMenuOpen = false
  }

  async request() {
    if (this.active || !this.viewer.pagesCount || !this.container.requestFullscreen) {
      return
    }

    this.addFullscreenChangeListeners()
    this.notifyStateChange(PresentationModeState.CHANGING)

    this.args = {
      pageNumber: this.viewer.currentPageNumber,
      scaleValue: this.viewer.currentScaleValue,
      scrollMode: this.viewer.scrollMode,
      spreadMode: undefined,
      annotationEditorMode: undefined,
    }

    if (
      this.viewer.spreadMode !== SpreadMode.NONE
      && !(this.viewer.pagesReady && this.viewer.hasEqualPageSizes)
    ) {
      this.viewer.logger.warn('Ignoring Spread modes when entering Presentation, since the document may contain varying page sizes.')
      this.args.spreadMode = this.viewer.spreadMode
    }

    if (this.viewer.getAnnotationEditorMode() !== AnnotationEditorType.DISABLE) {
      this.args.annotationEditorMode = this.viewer.getAnnotationEditorMode()
    }

    try {
      await this.container.requestFullscreen()
      this.viewer.focus()
      return
    } catch {
      this.removeFullscreenChangeListeners()
      this.notifyStateChange(PresentationModeState.NORMAL)
    }
  }

  get active() {
    return (
      this.state === PresentationModeState.CHANGING
      || this.state === PresentationModeState.FULLSCREEN
    )
  }

  private mouseWheel(event: WheelEvent) {
    if (!this.active) {
      return
    }

    event.preventDefault()

    const delta = normalizeWheelEventDelta(event)
    const currentTime = Date.now()
    const storedTime = this.mouseScrollTimeStamp

    if (
      currentTime > storedTime
      && currentTime - storedTime < MOUSE_SCROLL_COOLDOWN_TIME
    ) {
      return
    }

    if (
      (this.mouseScrollDelta > 0 && delta < 0)
      || (this.mouseScrollDelta < 0 && delta > 0)
    ) {
      this.resetMouseScrollState()
    }

    this.mouseScrollDelta += delta

    if (Math.abs(this.mouseScrollDelta) < PAGE_SWITCH_THRESHOLD) {
      return
    }

    const totalDelta = this.mouseScrollDelta
    this.resetMouseScrollState()

    if (totalDelta > 0 ? this.viewer.previousPage() : this.viewer.nextPage()) {
      this.mouseScrollTimeStamp = currentTime
    }
  }

  private notifyStateChange(state: PresentationModeState) {
    this.state = state
    this.viewer.dispatch('presentationmodechanged', { state })
  }

  private enter() {
    this.notifyStateChange(PresentationModeState.FULLSCREEN)
    this.container.classList.add(ACTIVE_SELECTOR)

    queueMicrotask(() => {
      this.viewer.scrollMode = ScrollMode.PAGE
      if (this.args?.spreadMode) this.viewer.spreadMode = SpreadMode.NONE
      this.viewer.currentPageNumber = this.args!.pageNumber
      this.viewer.currentScaleValue = 'page-fit'

      if (this.args?.annotationEditorMode) {
        this.viewer.annotationEditorMode = {
          mode: AnnotationEditorType.NONE,
        }
      }
    })

    this.addWindowListeners()
    this.showControls()
    this.contextMenuOpen = false
    document.getSelection()?.empty()
  }

  private exit() {
    const pageNumber = this.viewer.currentPageNumber
    this.container.classList.remove(ACTIVE_SELECTOR)

    queueMicrotask(() => {
      this.removeFullscreenChangeListeners()
      this.notifyStateChange(PresentationModeState.NORMAL)

      if (this.args) {
        this.viewer.scrollMode = this.args.scrollMode
        if (this.args.spreadMode) this.viewer.spreadMode = this.args.spreadMode
        if (this.args.scaleValue) this.viewer.currentScaleValue = this.args.scaleValue
        this.viewer.currentPageNumber = pageNumber

        if (this.args.annotationEditorMode) {
          this.viewer.annotationEditorMode = {
            mode: this.args.annotationEditorMode,
          }
        }

        this.args = undefined
      }
    })

    this.reset()
  }

  private mouseDown(event: MouseEvent) {
    if (this.contextMenuOpen) {
      this.contextMenuOpen = false
      event.preventDefault()
      return
    }

    if (event.button !== 0) {
      return
    }

    if (
      event.target instanceof HTMLAnchorElement
      && event.target.href
      && event.target.parentElement?.hasAttribute('data-internal-link')
    ) {
      return
    }

    event.preventDefault()

    if (event.shiftKey) {
      this.viewer.previousPage()
    } else {
      this.viewer.nextPage()
    }
  }

  private contextMenu() {
    this.contextMenuOpen = true
  }

  private showControls() {
    if (this.controlsTimeout) {
      clearTimeout(this.controlsTimeout)
    } else {
      this.container.classList.add(CONTROLS_SELECTOR)
    }

    this.controlsTimeout = setTimeout(() => {
      this.container.classList.remove(CONTROLS_SELECTOR)
      delete this.controlsTimeout
    }, DELAY_BEFORE_HIDING_CONTROLS)
  }

  private hideControls() {
    if (!this.controlsTimeout) {
      return
    }

    clearTimeout(this.controlsTimeout)
    this.container.classList.remove(CONTROLS_SELECTOR)
    delete this.controlsTimeout
  }

  private resetMouseScrollState() {
    this.mouseScrollTimeStamp = 0
    this.mouseScrollDelta = 0
  }

  private touchSwipe(event: TouchEvent) {
    if (!this.active) {
      return
    }

    if (event.touches.length > 1) {
      this.touchSwipeState = undefined
      return
    }

    switch (event.type) {
      case 'touchstart':
        this.touchSwipeState = {
          startX: event.touches[0].pageX,
          startY: event.touches[0].pageY,
          endX: event.touches[0].pageX,
          endY: event.touches[0].pageY,
        }
        break

      case 'touchmove':
        if (!this.touchSwipeState) {
          return
        }

        this.touchSwipeState.endX = event.touches[0].pageX
        this.touchSwipeState.endY = event.touches[0].pageY
        event.preventDefault()
        break

      case 'touchend': {
        if (!this.touchSwipeState) {
          return
        }

        let delta = 0
        const dx = this.touchSwipeState.endX - this.touchSwipeState.startX
        const dy = this.touchSwipeState.endY - this.touchSwipeState.startY
        const absAngle = Math.abs(Math.atan2(dy, dx))

        if (
          Math.abs(dx) > SWIPE_MIN_DISTANCE_THRESHOLD
          && (absAngle <= SWIPE_ANGLE_THRESHOLD
            || absAngle >= Math.PI - SWIPE_ANGLE_THRESHOLD)
        ) {
          // Horizontal swipe.
          delta = dx
        } else if (
          Math.abs(dy) > SWIPE_MIN_DISTANCE_THRESHOLD
          && Math.abs(absAngle - Math.PI / 2) <= SWIPE_ANGLE_THRESHOLD
        ) {
          // Vertical swipe.
          delta = dy
        }

        if (delta > 0) {
          this.viewer.previousPage()
        } else if (delta < 0) {
          this.viewer.nextPage()
        }
        break
      }
    }
  }

  private addWindowListeners() {
    if (this.windowAbortController) {
      return
    }

    this.windowAbortController = new AbortController()
    const { signal } = this.windowAbortController
    const touchSwipeBind = this.touchSwipe.bind(this)

    window.addEventListener('mousemove', this.showControls.bind(this), { signal })
    window.addEventListener('mousedown', this.mouseDown.bind(this), { signal })
    window.addEventListener('wheel', this.mouseWheel.bind(this), { passive: false, signal })
    window.addEventListener('keydown', this.resetMouseScrollState.bind(this), { signal })
    window.addEventListener('contextmenu', this.contextMenu.bind(this), { signal })
    window.addEventListener('touchstart', touchSwipeBind, { signal })
    window.addEventListener('touchmove', touchSwipeBind, { signal })
    window.addEventListener('touchend', touchSwipeBind, { signal })
  }

  private removeWindowListeners() {
    this.windowAbortController?.abort()
    this.windowAbortController = undefined
  }

  private addFullscreenChangeListeners() {
    if (this.fullscreenChangeAbortController) {
      return
    }

    this.fullscreenChangeAbortController = new AbortController()

    window.addEventListener(
      'fullscreenchange',
      () => {
        if (document.fullscreenElement) {
          this.enter()
        } else {
          this.exit()
        }
      },
      { signal: this.fullscreenChangeAbortController.signal },
    )
  }

  private removeFullscreenChangeListeners() {
    this.fullscreenChangeAbortController?.abort()
    this.fullscreenChangeAbortController = undefined
  }
}
