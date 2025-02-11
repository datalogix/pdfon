import { Plugin, ToolbarItemType } from '../plugin'
import { CloseToolbarItem } from './close-toolbar-item'

export type ClosePluginParams = {
  url: string
  confirm?: boolean
  confirmMessage?: string
}

export class ClosePlugin extends Plugin<ClosePluginParams> {
  protected readonly closeToolbarItem = new CloseToolbarItem()

  protected getToolbarItems() {
    return new Map<string, ToolbarItemType>([
      ['close', this.closeToolbarItem],
    ])
  }

  protected onLoad() {
    this.closeToolbarItem.toggle()
  }

  close() {
    const confirm = !(this.resolvedParams?.confirm ?? true)
      || window.confirm(this.resolvedParams?.confirmMessage ?? this.translate('confirm'))

    if (!confirm) {
      return
    }

    window.location.href = String(this.resolvedParams?.url)
  }
}
