import { ToolbarAction } from '@/toolbar'
import { DownloadPlugin } from './download-plugin'

export class DownloadToolbarItem extends ToolbarAction {
  get downloadPlugin() {
    return this.viewer.getLayerProperty<DownloadPlugin>('DownloadPlugin')
  }

  get enabled() {
    return true
  }

  protected execute() {
    this.downloadPlugin?.downloadOrSave()
  }
}
