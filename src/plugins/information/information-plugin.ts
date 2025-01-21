import { Plugin, type ToolbarItemType } from '../plugin'
import type { Information } from './information'
import { InformationManager } from './information-manager'
import { InformationToolbarItem } from './information-toolbar-item'

export type InformationPluginParams = {
  informations?: Information[]
}

export class InformationPlugin extends Plugin<InformationPluginParams> {
  protected getToolbarItems() {
    return new Map<string, ToolbarItemType>([
      ['information', InformationToolbarItem],
    ])
  }

  private _informationManager?: InformationManager

  get informationManager() {
    return this._informationManager
  }

  protected init() {
    this._informationManager = new InformationManager(this.eventBus)

    this.on('documentdestroy', () => this._informationManager?.destroy())
    this.on('informationload', ({ informations }) => this._informationManager?.set(informations))
    this.on('informationadd', ({ information }) => this._informationManager?.add(information))
    this.on('informationdelete', ({ information }) => this._informationManager?.delete(information))
  }

  protected onLoad() {
    if (!this.params?.informations) {
      return
    }

    this._informationManager?.set(this.params?.informations)
  }

  protected destroy() {
    this._informationManager?.destroy()
    this._informationManager = undefined
  }
}
