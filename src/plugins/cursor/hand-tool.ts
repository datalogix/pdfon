import { stopEvent } from '@/pdfjs'

export class HandTool {
  private activateAbortController?: AbortController
  private mouseDownAbortController?: AbortController
  private scrollAbortController?: AbortController
  private scrollLeftStart = 0
  private scrollTopStart = 0
  private clientXStart = 0
  private clientYStart = 0

  constructor(private readonly element: HTMLDivElement) {}

  activate() {
    if (this.activateAbortController) return

    this.activateAbortController = new AbortController()
    this.element.addEventListener('mousedown', this.onMouseDown.bind(this), {
      capture: true,
      signal: this.activateAbortController.signal,
    })
    this.element.classList.add('grab')
  }

  deactivate() {
    if (!this.activateAbortController) return

    this.activateAbortController.abort()
    this.activateAbortController = undefined
    this.endPan()
    this.element.classList.remove('grab')
  }

  toggle() {
    if (this.activateAbortController) {
      this.deactivate()
    } else {
      this.activate()
    }
  }

  private ignoreTarget(node: HTMLElement) {
    return node.matches('a[href], a[href] *, input, textarea, button, button *, select, option')
  }

  private onMouseDown(event: MouseEvent) {
    const target = event.target as HTMLElement

    if (event.button !== 0 || this.ignoreTarget(target)) {
      return
    }

    this.scrollLeftStart = this.element.scrollLeft
    this.scrollTopStart = this.element.scrollTop
    this.clientXStart = event.clientX
    this.clientYStart = event.clientY

    this.mouseDownAbortController = new AbortController()
    this.element.addEventListener('mousemove', this.onMouseMove.bind(this), { capture: true, signal: this.mouseDownAbortController.signal })
    this.element.addEventListener('mouseup', this.endPan.bind(this), { capture: true, signal: this.mouseDownAbortController.signal })
    // When a scroll event occurs before a mousemove, assume that the user
    // dragged a scrollbar (necessary for Opera Presto, Safari and IE)
    // (not needed for Chrome/Firefox)
    this.scrollAbortController = new AbortController()

    this.element.addEventListener('scroll', this.endPan.bind(this), {
      capture: true,
      signal: this.scrollAbortController.signal,
    })

    stopEvent(event)

    const focusedElement = document.activeElement as HTMLElement
    if (focusedElement && !focusedElement.contains(target)) {
      focusedElement.blur()
    }
  }

  private onMouseMove(event: MouseEvent) {
    this.scrollAbortController?.abort()
    this.scrollAbortController = undefined

    if (!(event.buttons & 1)) {
      // The left mouse button is released.
      this.endPan()
      return
    }

    const xDiff = event.clientX - this.clientXStart
    const yDiff = event.clientY - this.clientYStart

    this.element.scrollTo({
      top: this.scrollTopStart - yDiff,
      left: this.scrollLeftStart - xDiff,
      behavior: 'instant',
    })
  }

  private endPan(_event?: MouseEvent | Event) {
    this.mouseDownAbortController?.abort()
    this.mouseDownAbortController = undefined
    this.scrollAbortController?.abort()
    this.scrollAbortController = undefined
  }
}
