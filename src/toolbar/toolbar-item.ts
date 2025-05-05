import { Extension } from '@/core/extension'
import { createElement, generateName } from '@/utils'

export type ToolbarItemType = ToolbarItem | (new () => ToolbarItem)

export abstract class ToolbarItem extends Extension {
  private _name?: string
  protected container = createElement('div', ['toolbar-item', this.className])
  protected initialized = false
  protected abortController?: AbortController

  get name() {
    return this._name ||= generateName(this, 'ToolbarItem')
  }

  get viewer() {
    return this.toolbar.viewer
  }

  get signal() {
    return this.abortController?.signal
  }

  get className() {
    return `toolbar-item-${this.name}`
  }

  translate(key: string, options?: object) {
    return this.l10n.get(`toolbar.${this.name}.${key}`.toLowerCase(), options)
  }

  async initialize() {
    if (this.initialized) return

    this.initialized = true
    this.abortController = new AbortController()
    this.show()

    await this.init()

    this.dispatch(`ToolbarItem${this.name}Init`)
  }

  async terminate() {
    if (!this.initialized) return

    this.initialized = false
    this.hide()

    await this.destroy()

    this.dispatch(`ToolbarItem${this.name}Destroy`)

    this.abortController?.abort()
    this.abortController = undefined
    // this.container.remove()
  }

  protected init(): Promise<void> | void {
    //
  }

  protected destroy(): Promise<void> | void {
    //
  }

  hide() {
    this.container.hidden = true
    this.container.classList.add('hidden')
  }

  show() {
    this.container.hidden = false
    this.container.classList.remove('hidden')
  }

  render() {
    return this.container
  }
}
