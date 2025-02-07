import { Plugin, type ToolbarItemType } from '../plugin'
import { PresentationToolbarItem } from './presentation-toolbar-item'
import { PresentationService } from './presentation-service'

export class PresentationPlugin extends Plugin {
  protected getToolbarItems() {
    return new Map<string, ToolbarItemType>([
      ['presentation', PresentationToolbarItem],
    ])
  }

  private _presentationService?: PresentationService

  get presentationService() {
    return this._presentationService
  }

  protected init() {
    this._presentationService = new PresentationService(this.viewer)
  }

  protected destroy() {
    this._presentationService?.reset()
    this._presentationService = undefined
  }
}
