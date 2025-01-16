import { Initializer, type InitializerOptions } from '@/viewer'
import { apiPageModeToSidebar } from './sidebar-types'

export class SidebarInitializer extends Initializer {
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
    this.dispatch('storeonevent', { eventName: 'sidebarselected', key: 'sidebar', parameter: 'key' })
    this.dispatch('storeonevent', { eventName: 'sidebartoggle', key: 'sidebaropened', parameter: 'opened' })
  }
}
