import { ToolbarActionToggle } from '@/toolbar'
import type { SidebarPlugin } from './sidebar-plugin'

export class SidebarToolbarItem extends ToolbarActionToggle {
  get sidebarManager() {
    return this.viewer.getLayerProperty<SidebarPlugin>('SidebarPlugin')?.sidebarManager
  }

  get enabled() {
    return (this.sidebarManager?.length ?? 0) > 0
  }

  protected init() {
    this.on('sidebaropen', () => {
      this.opened = true
    })

    this.on('sidebarclose', () => {
      this.opened = false
    })
  }

  open() {
    this.sidebarManager?.open()
  }

  close() {
    this.sidebarManager?.close()
  }
}
