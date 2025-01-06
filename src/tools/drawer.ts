import { createElement } from '@/utils'

export type DrawerOptions = {
  position?: 'top' | 'bottom' | 'left' | 'right'
  backdrop?: false | 'none' | 'blur' | 'overlay' | 'invisible'
  closeOnClickBackdrop?: boolean
  closeOnEscape?: boolean
  classes?: string | string[]
  onClose?: () => void
}

export class Drawer {
  protected readonly options: DrawerOptions = {
    position: 'left',
    backdrop: 'overlay',
    closeOnClickBackdrop: true,
    closeOnEscape: true,
  }

  protected container = createElement('div', 'drawer')
  protected opened = false
  protected onKeydownListener = this.onKeydown.bind(this)

  constructor(options?: DrawerOptions) {
    this.options = { ...this.options, ...(options || {}) }
    this.container.classList.add(`drawer-${this.options.position ?? 'left'}`)

    if (Array.isArray(this.options.classes)) {
      this.container.classList.add(...this.options.classes)
    } else if (typeof this.options.classes === 'string') {
      this.container.classList.add(this.options.classes)
    }
  }

  render(content: HTMLElement, root: HTMLElement = document.body) {
    const container = createElement('div', 'drawer-container')
    container.appendChild(content)

    this.container.appendChild(container)
    root.appendChild(this.container)
    this.buildBackdrop()
  }

  private buildBackdrop() {
    if (!this.options.backdrop || this.options.backdrop === 'none') return

    const backdrop = createElement('div', ['drawer-backdrop', `drawer-backdrop-${this.options.backdrop}`])
    this.container.appendChild(backdrop)

    if (this.options.closeOnClickBackdrop) {
      backdrop.classList.add('drawer-backdrop-click')
      backdrop.addEventListener('click', () => this.close())
    }
  }

  get isOpened() {
    return this.opened
  }

  open() {
    this.opened = true
    this.container.classList.add('drawer-opened')

    if (this.options.closeOnEscape) {
      this.container.parentElement?.addEventListener('keydown', this.onKeydownListener)
    }
  }

  protected onKeydown(event: KeyboardEvent) {
    if (event.code.toLowerCase() !== 'escape') return

    this.close()
  }

  close() {
    if (!this.opened) return

    this.opened = false
    this.container.classList.remove('drawer-opened')

    if (this.options.closeOnEscape) {
      this.container.parentElement?.removeEventListener('keydown', this.onKeydownListener)
    }

    if (this.options.onClose) {
      queueMicrotask(this.options.onClose)
    }
  }

  toggle() {
    if (this.opened) {
      this.close()
    } else {
      this.open()
    }
  }
}
