import { ToolbarAction } from '@/toolbar'
import { type ClosePlugin } from './close-plugin'

export class CloseToolbarItem extends ToolbarAction {
  get closePlugin() {
    return this.viewer.getLayerProperty<ClosePlugin>('closePlugin')!
  }

  get enabled() {
    return !!this.closePlugin.resolvedParams?.url
  }

  protected execute() {
    this.closePlugin.close()
  }
}
