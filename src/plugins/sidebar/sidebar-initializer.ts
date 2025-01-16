import { Initializer, type InitializerOptions } from '@/viewer'
import { apiPageModeToSidebar } from './sidebar-types'
import { StoragePlugin } from '../storage'

export class SidebarInitializer extends Initializer {
  get storage() {
    return this.viewer.getLayerProperty<StoragePlugin>('StoragePlugin')?.storage
  }

  async prepare(options: InitializerOptions) {
    const pageMode = await this.pdfDocument.getPageMode().catch(() => { })

    if (pageMode && options.sidebar === undefined) {
      options.sidebar = apiPageModeToSidebar(pageMode)
    }

    return options
  }

  execute(options: InitializerOptions) {
    if (options.sidebar) {
      this.dispatch('sidebarselect', {
        key: options.sidebar,
        open: options.sidebaropened,
      })
    }
  }

  finish() {
    this.on('sidebarselected', ({ key }) => {
      this.storage?.set('sidebar', key)
    })

    this.on('sidebartoggle', ({ opened }) => {
      this.storage?.set('sidebaropened', opened)
    })

    // this.dispatch('storageupdate', { event: 'sidebarselected', name: 'sidebar', parameter: 'key' })
    // this.dispatch('storageupdate', { event: 'sidebartoggle', name: 'sidebaropened', parameter: 'opened' })
  }
}
