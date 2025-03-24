import { Initializer, type InitializerOptions } from '@/viewer'
import type { SidebarPlugin } from './sidebar-plugin'

export class SidebarInitializer extends Initializer {
  get sidebarManager() {
    return this.viewer.getLayerProperty<SidebarPlugin>('SidebarPlugin')?.sidebarManager
  }

  async prepare(options: InitializerOptions) {
    if (options.sidebar !== undefined) {
      return options
    }

    const pageMode = await this.pdfDocument?.getPageMode().catch(() => { })

    if (pageMode) {
      switch (pageMode) {
        case 'UseThumbs':
          options.sidebar = 'thumbnail'
          break
        case 'UseOutlines':
          options.sidebar = 'outline'
          break
        case 'UseAttachments':
          options.sidebar = 'attachment'
          break
        case 'UseOC':
          options.sidebar = 'layer'
          break
      }
    }

    return options
  }

  execute(options: InitializerOptions) {
    if (!options.sidebar) {
      return
    }

    this.sidebarManager?.select(options.sidebar)

    if (options['sidebar-opened']) {
      this.sidebarManager?.open()
    }
  }

  finish() {
    this.dispatch('StoreOnEvent', { eventName: 'SidebarSelected', key: 'sidebar', parameter: 'sidebar' })
    this.dispatch('StoreOnEvent', { eventName: 'SidebarOpen', key: 'sidebar-opened', parameter: () => true })
    this.dispatch('StoreOnEvent', { eventName: 'SidebarClose', key: 'sidebar-opened', parameter: () => false })
  }
}
