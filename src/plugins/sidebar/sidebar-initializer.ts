import { Initializer, type InitializerParams } from '@/viewer'
import { apiPageModeToSidebar } from './sidebar-types'

export class SidebarInitializer extends Initializer {
  async apply({ pdfDocument, options }: InitializerParams) {
    const pageMode = await pdfDocument.getPageMode().catch(() => { })

    if (pageMode && options.sidebar === undefined) {
      options.sidebar = apiPageModeToSidebar(pageMode)
    }

    return options
  }
}
