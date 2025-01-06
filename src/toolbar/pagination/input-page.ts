import { createElement, debounce } from '@/utils'
import { ToolbarItem } from '@/toolbar'

export class InputPage extends ToolbarItem {
  protected input?: HTMLInputElement
  protected total?: HTMLSpanElement
  protected onKeyDownListener = this.onKeyDown.bind(this)
  protected onKeyUpListener = debounce(this.onKeyUp.bind(this))

  protected init() {
    this.input = createElement('input', {
      type: 'number',
      min: '1',
      title: this.l10n.get('toolbar.inputpage.title'),
    })
    this.container.appendChild(this.input)
    this.total = createElement('span')
    this.container.appendChild(this.total)

    this.disable()

    this.on('pagesinit', () => {
      this.enable()
    })

    this.on('pagesdestroy', () => {
      this.disable()
    })

    this.on('pagechanging', () => {
      if (!this.input) return

      this.input.value = this.viewer.currentPageNumber.toString()
    })
  }

  protected destroy() {
    this.disable()

    this.input?.remove()
    this.input = undefined

    this.total?.remove()
    this.total = undefined
  }

  enable() {
    if (!this.input) return

    this.input.addEventListener('keydown', this.onKeyDownListener)
    this.input.addEventListener('keyup', this.onKeyUpListener)
    this.input.disabled = false
    this.input.max = this.viewer.pagesCount.toString()
    this.input.value = this.viewer.currentPageNumber.toString()

    if (this.total) {
      this.total.innerText = this.l10n.get('toolbar.inputpage.of-pages', { pagesCount: this.viewer.pagesCount })
    }
  }

  disable() {
    if (!this.input) return

    this.input.removeEventListener('keydown', this.onKeyDownListener)
    this.input.removeEventListener('keyup', this.onKeyUpListener)
    this.input.disabled = true
    this.input.value = ''

    if (this.total) this.total.innerText = ''
  }

  protected onKeyDown(event: KeyboardEvent) {
    if (event.key.toLowerCase() === 'enter') {
      this.onKeyUp(event)
    }
  }

  protected onKeyUp(event: KeyboardEvent) {
    const input = event.target as HTMLInputElement
    let value = parseInt(input.value)
    const min = parseInt(input.min)
    const max = parseInt(input.max)

    if (value === this.viewer.currentPageNumber) {
      return
    }

    if (isNaN(value)) {
      input.value = this.viewer.currentPageNumber.toString()
      return
    }

    if (value < min) value = min
    if (value > max) value = max

    input.value = value.toString()
    this.viewer.currentPageNumber = value
  }
}
