import { DownloadPlugin, OpenPlugin, PrintPlugin } from '@/plugins'
import { Pdfon, type PdfonOptions } from './pdfon'

export class PdfonPrivate extends Pdfon {
  constructor() {
    super()

    this.removePlugin(DownloadPlugin)
    this.removePlugin(OpenPlugin)
    this.removePlugin(PrintPlugin)
  }

  async render(options: Partial<PdfonOptions> = {}) {
    return super.render({
      viewerOptions: {
        enableTitleUpdate: false,
      },
      ...options,
    })
  }
}
