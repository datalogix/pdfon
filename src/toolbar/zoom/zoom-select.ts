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
      title: this.l10n.get('toolbar.zoomselect.title'),
      oncontextmenu: preventDefault(),
    })
    this.container.appendChild(this.select)
    this.disable()
    this.createOptions()

    this.on('pagesinit', () => {
      this.selectOption()
      this.enable()
    })

    this.on('pagesdestroy', () => {
      this.disable()
    })

    this.on('scalechanging', () => this.selectOption())
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
      [this.l10n.get('toolbar.zoomselect.options.auto'), 'auto'],
      [this.l10n.get('toolbar.zoomselect.options.actual'), 'page-actual'],
      [this.l10n.get('toolbar.zoomselect.options.fit'), 'page-fit'],
      [this.l10n.get('toolbar.zoomselect.options.width'), 'page-width'],
      [this.l10n.get('toolbar.zoomselect.options.percent', { value: 50 }), '0.5'],
      [this.l10n.get('toolbar.zoomselect.options.percent', { value: 75 }), '0.75'],
      [this.l10n.get('toolbar.zoomselect.options.percent', { value: 100 }), '1'],
      [this.l10n.get('toolbar.zoomselect.options.percent', { value: 125 }), '1.25'],
      [this.l10n.get('toolbar.zoomselect.options.percent', { value: 150 }), '1.5'],
      [this.l10n.get('toolbar.zoomselect.options.percent', { value: 200 }), '2'],
      [this.l10n.get('toolbar.zoomselect.options.percent', { value: 300 }), '3'],
      [this.l10n.get('toolbar.zoomselect.options.percent', { value: 400 }), '4'],
    ])

    options.forEach((value, text) => this.select?.options.add(createElement('option', { value, text })))

    this.customOption.text = this.l10n.get('toolbar.zoomselect.options.percent', { value: 0 })
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
      this.customOption.text = this.l10n.get(
        'toolbar.zoomselect.options.percent',
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
