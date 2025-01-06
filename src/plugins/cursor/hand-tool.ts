import { createElement } from '@/utils'

export class HandTool {
  private active = false
  private scrollLeftStart = 0
  private scrollTopStart = 0
  private clientXStart = 0
  private clientYStart = 0
  private onMouseDownListener = this.onMouseDown.bind(this)
  private onMouseMoveListener = this.onMouseMove.bind(this)
  private onMouseUpListener = this.onMouseUp.bind(this)
  private overlay: HTMLDivElement = createElement('div', 'grabbing-overlay')

  constructor(private readonly element: HTMLDivElement) {}

  activate() {
    if (this.active) return

    this.active = true
    this.element.addEventListener('mousedown', this.onMouseDownListener, true)
    this.element.classList.add('grab')
  }

  deactivate() {
    if (!this.active) return

    this.active = false
    this.element.removeEventListener('mousedown', this.onMouseDownListener, true)
    this.onMouseUp()
    this.element.classList.remove('grab')
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

    this.element.addEventListener('mousemove', this.onMouseMoveListener, true)
    this.element.addEventListener('mouseup', this.onMouseUpListener, true)
    this.element.addEventListener('scroll', this.onMouseUpListener, true)

    event.preventDefault()
    event.stopPropagation()

    const focusedElement = document.activeElement as HTMLElement
    if (focusedElement && !focusedElement.contains(target)) {
      focusedElement.blur()
    }
  }

  private onMouseMove(event: MouseEvent) {
    this.element.removeEventListener('scroll', this.onMouseUpListener, true)

    if (!(event.buttons & 1)) {
      this.onMouseUp()
      return
    }

    const xDiff = event.clientX - this.clientXStart
    const yDiff = event.clientY - this.clientYStart

    this.element.scrollTo({
      top: this.scrollTopStart - yDiff,
      left: this.scrollLeftStart - xDiff,
      behavior: 'instant',
    })

    if (!this.overlay.parentNode) {
      this.element.append(this.overlay)
    }
  }

  private onMouseUp(_event?: MouseEvent | Event) {
    this.element.removeEventListener('mousemove', this.onMouseMoveListener, true)
    this.element.removeEventListener('mouseup', this.onMouseUpListener, true)
    this.element.removeEventListener('scroll', this.onMouseUpListener, true)
    this.overlay.remove()
  }
}
