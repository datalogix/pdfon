import { apiPageLayoutToViewerModes, apiPageModeToSidebar } from '@/utils'
import { Initializer, type InitializerParams } from './initializer'

export class DocumentInitializer extends Initializer {
  async apply({ pdfDocument, options }: InitializerParams) {
    const pageLayoutPromise = pdfDocument.getPageLayout().catch(() => { })
    const pageModePromise = pdfDocument.getPageMode().catch(() => { })

    const [pageLayout, pageMode] = await Promise.all([pageLayoutPromise, pageModePromise])

    if (pageMode && options.sidebar === undefined) {
      options.sidebar = apiPageModeToSidebar(pageMode)
    }

    if (pageLayout && (options.scroll === undefined || options.spread === undefined)) {
      const modes = apiPageLayoutToViewerModes(pageLayout)
      options.scroll = modes.scrollMode
      options.spread = modes.spreadMode
    }

    return options
  }
}
