import { ToolbarAction } from '@/toolbar'
import type { PrintPlugin } from './print-plugin'

export class PrintToolbarItem extends ToolbarAction {
  get printPlugin() {
    return this.viewer.getLayerProperty<PrintPlugin>('PrintPlugin')!
  }

  get enabled() {
    return !!this.printPlugin.supportsPrinting
  }

  protected execute() {
    this.printPlugin.triggerPrint()
  }
}
