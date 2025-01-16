import { Plugin } from '../plugin'
import type { StoragePlugin } from '../storage'
import { SidebarInitializer } from './sidebar-initializer'

export class SidebarPlugin extends Plugin {
  get storage() {
    return this.viewer.getLayerProperty<StoragePlugin>('StoragePlugin')?.storage
  }

  init() {
    this.viewer.addInitializer(new SidebarInitializer())

    this.on('documentinitialized', ({ options }) => {
      if (options?.sidebar) {
        queueMicrotask(() => this.dispatch('sidebarselect', {
          key: options?.sidebar,
          open: options?.sidebaropened,
        }))
      }

      this.on('sidebarselected', ({ key: sidebar }) => {
        this.storage?.set('sidebar', sidebar)
      })

      this.on('sidebartoggle', ({ opened }) => {
        this.storage?.set('sidebaropened', opened)
      })
    })
  }
}
