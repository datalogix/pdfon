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
    this.openService = new OpenService(this.container, this.l10n)
    this.openService.onChooseFile((file, blob) => {
      if (this.viewer.isInPresentationMode) return

      this.viewer.openDocument(blob, file.name)
    })

    this.on('openfile', () => this.openService?.chooseFile())
    this.on('documentload', () => this.openService?.hideDropzone())
    this.on(['documentempty', 'documenterror'], () => this.openService?.showDropzone())
  }

  protected destroy() {
    this.openService?.reset()
    this.openService = undefined
  }
}
