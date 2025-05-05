import { Dispatcher } from '@/bus'
import { createElement, generateName } from '@/utils'
import type { SidebarManager } from './sidebar-manager'

export abstract class SidebarItem extends Dispatcher {
  private _name?: string
  protected container = createElement('div', 'sidebar-content')
  protected initialized = false
  protected opened = false
  protected sidebarManager?: SidebarManager
  protected abortController?: AbortController

  constructor() {
    super()
    this.hide()
  }

  setSidebarManager(sidebarManager: SidebarManager) {
    this.sidebarManager = sidebarManager
  }

  get name() {
    return this._name ||= generateName(this, 'SidebarItem')
  }

  get order() {
    return 0
  }

  get viewer() {
    return this.sidebarManager!.viewer
  }

  get eventBus() {
    return this.sidebarManager!.eventBus
  }

  get signal() {
    return this.abortController?.signal
  }

  abstract build(): Node

  async initialize() {
    if (this.initialized) return

    this.initialized = true
    this.abortController = new AbortController()
    this.container.appendChild(this.build())

    await this.init()
  }

  async terminate() {
    if (!this.initialized) return

    this.initialized = false
    this.hide()

    await this.destroy()

    this.abortController?.abort()
    this.abortController = undefined
    this.container.innerHTML = ''

    this.sidebarManager?.delete(this)
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
