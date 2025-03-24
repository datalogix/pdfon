import { Plugin, ToolbarItemType } from '../plugin'
import { CloseToolbarItem } from './close-toolbar-item'

export type ClosePluginParams = {
  url: string
  confirm?: boolean
  confirmMessage?: string
}

export class ClosePlugin extends Plugin<ClosePluginParams> {
  protected getToolbarItems() {
    return new Map<string, ToolbarItemType>(
      this.resolvedParams?.url ? [['close', CloseToolbarItem]] : [],
    )
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
