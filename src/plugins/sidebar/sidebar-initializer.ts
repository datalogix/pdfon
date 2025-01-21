import { Initializer, type InitializerOptions } from '@/viewer'
import type { SidebarPlugin } from './sidebar-plugin'

export class SidebarInitializer extends Initializer {
  get sidebarManager() {
    return this.viewer.getLayerProperty<SidebarPlugin>('SidebarPlugin')?.sidebarManager
  }

  async prepare(options: InitializerOptions) {
    const pageMode = await this.pdfDocument.getPageMode().catch(() => { })

    if (pageMode && options.sidebar === undefined) {
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

    if (options.sidebaropened) {
      this.sidebarManager?.open()
    }
  }

  finish() {
    this.dispatch('storeonevent', { eventName: 'sidebarselected', key: 'sidebar', parameter: 'sidebar' })
    this.dispatch('storeonevent', { eventName: 'sidebaropen', key: 'sidebaropened', parameter: () => true })
    this.dispatch('storeonevent', { eventName: 'sidebarclose', key: 'sidebaropened', parameter: () => false })
  }
}
