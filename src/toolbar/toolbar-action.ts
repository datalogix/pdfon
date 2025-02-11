import { createElement } from '@/utils'
import { ToolbarItem } from './toolbar-item'

export abstract class ToolbarAction extends ToolbarItem {
  private _button?: HTMLButtonElement
  protected onClickListener = this.onClick.bind(this)

  protected abstract execute(): Promise<void> | void

  async initialize() {
    if (this.initialized) return

    this._button = createElement('button', {
      type: 'button',
      innerHTML: `<span>${this.translate('label')}</span>`,
      title: this.translate('title'),
    })

    this.container.classList.add('toolbar-action')
    this.container.appendChild(this._button)
    this.disable()

    await super.initialize()

    this.on('PagesInit', () => {
      this.toggle()
      this.markAsActivated()
    })

    this.on('PagesDestroy', () => {
      this.toggle(false)
      this.markAsActivated(false)
    })
  }

  async terminate() {
    if (!this.initialized) return

    this.disable()

    this._button?.remove()
    this._button = undefined

    await super.terminate()
  }

  get enabled() {
    return false
  }

  get activated() {
    return false
  }

  get button() {
    return this._button
  }

  enable() {
    if (!this._button) return

    this._button.addEventListener('click', this.onClickListener)
    this._button.disabled = false
  }

  disable() {
    if (!this._button) return

    this._button.removeEventListener('click', this.onClickListener)
    this._button.disabled = true
  }

  toggle(value = this.enabled) {
    if (value) {
      this.enable()
    } else {
      this.disable()
    }
  }

  protected markAsActivated(value = this.activated) {
    if (value) {
      this._button?.classList.add('active')
    } else {
      this._button?.classList.remove('active')
    }
  }

  protected async onClick() {
    return this.execute()
  }
}
