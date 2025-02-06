import { ToolbarAction } from '@/toolbar'
import { ClosePluginParams } from './close-plugin'

export class CloseToolbarItem extends ToolbarAction {
  constructor(readonly options: ClosePluginParams) {
    super()
  }

  get enabled() {
    return !!this.options.url
  }

  protected execute() {
    const confirm = !(this.options.confirm ?? true)
      || window.confirm(this.options.confirmMessage ?? this.l10n.get('close.confirm'))

    if (!confirm) {
      return
    }

    window.location.href = String(this.options.url)
  }
}
