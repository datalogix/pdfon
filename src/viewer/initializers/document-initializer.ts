import { apiPageLayoutToViewerModes } from '@/utils'
import { Initializer, type InitializerOptions } from './initializer'

export class DocumentInitializer extends Initializer {
  async prepare(options: InitializerOptions) {
    const pageLayout = await this.pdfDocument.getPageLayout().catch(() => { })

    if (pageLayout && (options.scroll === undefined || options.spread === undefined)) {
      const modes = apiPageLayoutToViewerModes(pageLayout)
      options.scroll = modes.scrollMode
      options.spread = modes.spreadMode
    }

    return options
  }
}
