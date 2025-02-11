import { Plugin, type ToolbarItemType } from '../plugin'
import { SidebarInitializer } from './sidebar-initializer'
import type { SidebarItem } from './sidebar-item'
import { SidebarManager } from './sidebar-manager'
import { SidebarToolbarItem } from './sidebar-toolbar-item'

export type SidebarPluginParams = {
  items?: SidebarItem[]
  current?: string
}

export class SidebarPlugin extends Plugin<SidebarPluginParams> {
  protected getToolbarItems() {
    return new Map<string, ToolbarItemType>([
      ['sidebar', SidebarToolbarItem],
    ])
  }

  protected initializers = [SidebarInitializer]
  private _sidebarManager?: SidebarManager

  get sidebarManager() {
    return this._sidebarManager
  }

  protected init() {
    this._sidebarManager = new SidebarManager(this.eventBus, this.viewer, this.translator)

    this.on('SidebarAdd', ({ item, order }) => this._sidebarManager?.add(item, order))
    this.on('SidebarDelete', ({ item }) => this._sidebarManager?.delete(item))
  }

  protected onLoad() {
    if (this.resolvedParams?.items) {
      this.resolvedParams.items.forEach(item => this._sidebarManager?.add(item))
    }

    if (this.resolvedParams?.current) {
      queueMicrotask(() => this._sidebarManager?.select(this.resolvedParams?.current))
    }
  }

  protected destroy() {
    this._sidebarManager?.destroy()
    this._sidebarManager = undefined
  }
}
