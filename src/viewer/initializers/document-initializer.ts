import { apiPageLayoutToViewerModes } from '@/utils'
import { Initializer, type InitializerOptions } from './initializer'

export class DocumentInitializer extends Initializer {
  async prepare(options: InitializerOptions) {
    if (options.scroll !== undefined && options.spread !== undefined) {
      return options
    }

    const pageLayout = await this.pdfDocument.getPageLayout().catch(() => { })

    if (pageLayout) {
      const modes = apiPageLayoutToViewerModes(pageLayout)

      if (options.scroll === undefined) {
        options.scroll = modes.scrollMode
      }

      if (options.spread === undefined) {
        options.spread = modes.spreadMode
      }
    }

    return options
  }
}
