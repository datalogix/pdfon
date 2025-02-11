import { Plugin, type ToolbarItemType } from '../plugin'
import { OpenService } from './open-service'
import { OpenToolbarItem } from './open-toolbar-item'

export class OpenPlugin extends Plugin {
  protected getToolbarItems() {
    return new Map<string, ToolbarItemType>([
      ['open', OpenToolbarItem],
    ])
  }

  private openService?: OpenService

  protected init() {
    this.openService = new OpenService(this.container, this.translator)
    this.openService.onChooseFile((file, blob) => {
      if (this.viewer.isInPresentationMode) return

      this.viewer.openDocument(blob, file.name)
    })

    this.on('OpenFile', () => this.openService?.chooseFile())
    this.on('DocumentOpen', () => this.openService?.hideDropzone())
    this.on(['DocumentEmpty', 'DocumentError'], () => this.openService?.showDropzone())
  }

  protected destroy() {
    this.openService?.destroy()
    this.openService = undefined
  }
}
