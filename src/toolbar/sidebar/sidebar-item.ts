import { Dispatcher } from '@/bus'
import { createElement } from '@/utils'
import type { Sidebar } from './sidebar'

export abstract class SidebarItem extends Dispatcher {
  protected container = createElement('div', 'sidebar-content')
  protected initialized = false
  protected opened = false
  protected sidebar?: Sidebar
  protected abortController?: AbortController

  constructor() {
    super()
    this.hide()
  }

  setSidebar(sidebar: Sidebar) {
    this.sidebar = sidebar
  }

  get viewer() {
    return this.sidebar!.viewer
  }

  get eventBus() {
    return this.sidebar!.eventBus
  }

  get signal() {
    return this.abortController?.signal
  }

  get l10n() {
    return this.sidebar!.l10n
  }

  abstract build(): Node

  async initialize() {
    if (this.initialized) return

    this.initialized = true
    this.abortController = new AbortController()
    this.container.appendChild(this.build())

    await this.init()
  }

  async terminate(removeOfSidebar = true) {
    if (!this.initialized) return

    this.initialized = false
    this.hide()

    await this.destroy()

    this.abortController?.abort()
    this.abortController = undefined
    this.container.innerHTML = ''

    if (removeOfSidebar) {
      this.sidebar?.remove(this)
    }
  }

  protected init(): Promise<void> | void {
    //
  }

  protected destroy(): Promise<void> | void {
    //
  }

  toggle() {
    if (this.opened) {
      this.hide()
    } else {
      this.show()
    }
  }

  show() {
    if (!this.initialized) {
      this.initialize()
    }

    this.opened = true
    this.container.hidden = false
    this.container.classList.remove('hidden')
  }

  hide() {
    this.opened = false
    this.container.hidden = true
    this.container.classList.add('hidden')
  }

  render() {
    return this.container
  }
}
