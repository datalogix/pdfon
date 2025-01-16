import { apiPageLayoutToViewerModes } from '@/utils'
import { Initializer, type InitializerParams } from './initializer'

export class DocumentInitializer extends Initializer {
  async apply({ pdfDocument, options }: InitializerParams) {
    const pageLayout = await pdfDocument.getPageLayout().catch(() => { })

    if (pageLayout && (options.scroll === undefined || options.spread === undefined)) {
      const modes = apiPageLayoutToViewerModes(pageLayout)
      options.scroll = modes.scrollMode
      options.spread = modes.spreadMode
    }

    return options
  }
}
