import { resolveObject } from '@/utils'
import { Plugin, ToolbarItemType } from '../plugin'
import { CloseToolbarItem } from './close-toolbar-item'

export type ClosePluginParams = {
  url: string
  confirm?: boolean
  confirmMessage?: string
}

export class ClosePlugin extends Plugin<ClosePluginParams> {
  protected async getToolbarItems() {
    if (!this.params?.url) {
      return super.getToolbarItems()
    }

    return new Map<string, ToolbarItemType>([
      ['close', new CloseToolbarItem(await resolveObject(this.params))],
    ])
  }
}
