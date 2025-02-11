import { ToolbarItem } from '@/toolbar'
import { createElement, preventDefault } from '@/utils'

export class ZoomSelect extends ToolbarItem {
  protected select?: HTMLSelectElement
  protected onChangeListener = this.onChange.bind(this)
  protected customOption = createElement('option', {
    hidden: true,
    disabled: true,
    value: 'custom',
  })

  protected init() {
    this.select = createElement('select', {
      title: this.translate('title'),
      oncontextmenu: preventDefault(),
    })
    this.container.appendChild(this.select)
    this.disable()
    this.createOptions()

    this.on('PagesInit', () => {
      this.selectOption()
      this.enable()
    })

    this.on('PagesDestroy', () => {
      this.disable()
    })

    this.on('ScaleChanging', () => this.selectOption())
  }

  protected destroy() {
    this.disable()
    this.select?.remove()
    this.select = undefined
  }

  private createOptions() {
    while (this.select?.options.length) {
      this.select?.options.remove(0)
    }

    const options: Map<string, string> = new Map([
      [this.translate('options.auto'), 'auto'],
      [this.translate('options.actual'), 'page-actual'],
      [this.translate('options.fit'), 'page-fit'],
      [this.translate('options.width'), 'page-width'],
      [this.translate('options.percent', { value: 50 }), '0.5'],
      [this.translate('options.percent', { value: 75 }), '0.75'],
      [this.translate('options.percent', { value: 100 }), '1'],
      [this.translate('options.percent', { value: 125 }), '1.25'],
      [this.translate('options.percent', { value: 150 }), '1.5'],
      [this.translate('options.percent', { value: 200 }), '2'],
      [this.translate('options.percent', { value: 300 }), '3'],
      [this.translate('options.percent', { value: 400 }), '4'],
    ])

    options.forEach((value, text) => this.select?.options.add(createElement('option', { value, text })))

    this.customOption.text = this.translate('options.percent', { value: 0 })
    this.select?.options.add(this.customOption)
  }

  private selectOption() {
    let predefinedValueFound = false

    for (const option of Array.from(this.select?.options ?? [])) {
      if (option.value !== (this.viewer.currentScaleValue || this.viewer.currentScale).toString()) {
        option.selected = false
        continue
      }

      option.selected = true
      predefinedValueFound = true
    }

    if (!predefinedValueFound) {
      this.customOption.selected = true
      this.customOption.text = this.translate(
        'options.percent',
        { value: (Math.round(this.viewer.currentScale * 10000) / 100) },
      )
    }
  }

  enable() {
    if (!this.select) return

    this.select.addEventListener('change', this.onChangeListener)
    this.select.disabled = false
  }

  disable() {
    if (!this.select) return

    this.select.removeEventListener('change', this.onChangeListener)
    this.select.disabled = true
  }

  protected onChange(_event: Event) {
    const value = this.select?.value

    if (value !== 'custom' && value !== undefined) {
      this.viewer.currentScaleValue = value
    }
  }
}
