import { createElement, dragElement } from '@/utils'

export class Modal {
  private static backdrop?: HTMLDivElement
  private static container?: HTMLDivElement
  private static onClose?: () => void

  static open(html: HTMLElement, options?: {
    title?: string
    draggable?: boolean
    persist?: boolean
    backdrop?: 'blur' | 'overlay' | boolean
    onClose?: () => void
    root?: HTMLElement
  }) {
    this.close()
    options = options || {}
    this.onClose = options.onClose

    const container = createElement('div', 'modal-container')
    const root = options.root || document.body
    root.appendChild(container)

    let header = undefined

    if (options.title) {
      header = createElement('header', 'modal-header', { innerHTML: options.title })
      container.appendChild(header)
    }

    if (!options.persist) {
      const button = createElement('button', 'modal-close', { type: 'button' })
      button.addEventListener('click', () => this.close())
      container.appendChild(button)
    }

    if (options.draggable) {
      dragElement(container, header)
    }

    if (options.backdrop) {
      this.backdrop = createElement('div', ['modal-backdrop', `modal-backdrop-${options.backdrop === true ? 'overlay' : options.backdrop}`])

      this.backdrop?.addEventListener('click', () => {
        if (!options.persist) {
          this.close()
          return
        }

        container.classList.add('modal-persist')

        setTimeout(() => container.classList.remove('modal-persist'), 300)
      })

      root.appendChild(this.backdrop)
    }

    const content = createElement('div', 'modal-content')
    content.appendChild(html)
    container.appendChild(content)

    return this.container = container
  }

  static close() {
    this.backdrop?.remove()
    this.backdrop = undefined
    this.container?.remove()
    this.container = undefined

    const callback = this.onClose
    this.onClose = undefined
    callback?.()
  }
}
