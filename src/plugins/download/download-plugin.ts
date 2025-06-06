import { Plugin, type ToolbarItemType } from '../plugin'
import { DownloadManager } from './download-manager'
import { DownloadToolbarItem } from './download-toolbar-item'

export type DownloadPluginParams = {
  filename?: string
}

export class DownloadPlugin extends Plugin<DownloadPluginParams> {
  protected getToolbarItems() {
    return new Map<string, ToolbarItemType>([
      ['download', DownloadToolbarItem],
    ])
  }

  readonly downloadManager = new DownloadManager()
  private saveInProgress = false

  async downloadOrSave() {
    this.rootContainer.classList.add('download-container')

    if (this.pdfDocument && this.pdfDocument.annotationStorage.size > 0) {
      await this.save()
    } else {
      await this.download()
    }

    this.rootContainer.classList.remove('download-container')
  }

  async download() {
    let data
    try {
      data = await this.pdfDocument?.getData()
    } catch {
      // When the PDF document isn't ready, simply download using the URL.
    }

    this.downloadManager.download(
      data,
      this.viewer.baseUrl,
      this.resolvedParams?.filename || this.viewer.documentFilename,
    )
  }

  async save() {
    if (this.saveInProgress || !this.pdfDocument) {
      return
    }

    this.saveInProgress = true

    try {
      const data = await this.pdfDocument.saveDocument()
      this.downloadManager.download(
        data,
        this.viewer.baseUrl,
        this.resolvedParams?.filename || this.viewer.documentFilename,
      )
    } catch (reason: any) {
      this.logger.error('Error when saving the document', reason)
      await this.download()
    } finally {
      this.saveInProgress = false
    }
  }
}
