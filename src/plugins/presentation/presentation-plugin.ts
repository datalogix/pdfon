import { Plugin, type ToolbarItemType } from '../plugin'
import { PresentationToolbarItem } from './presentation-toolbar-item'
import { PresentationService } from './presentation-service'

export class PresentationPlugin extends Plugin {
  protected getToolbarItems() {
    return new Map<string, ToolbarItemType>([
      ['presentation', PresentationToolbarItem],
    ])
  }

  private presentationService?: PresentationService

  protected init() {
    this.presentationService = new PresentationService(this.viewer)
    this.on('presentationrequest', () => this.presentationService?.request())
  }

  protected destroy() {
    this.presentationService?.reset()
    this.presentationService = undefined
  }
}
