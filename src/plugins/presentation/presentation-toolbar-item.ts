import { ToolbarAction } from '@/toolbar'
import type { PresentationPlugin } from './presentation-plugin'

export class PresentationToolbarItem extends ToolbarAction {
  get presentationService() {
    return this.viewer.getLayerProperty<PresentationPlugin>('PresentationPlugin')?.presentationService
  }

  get enabled() {
    return this.container.ownerDocument.fullscreenEnabled
  }

  protected execute() {
    this.presentationService?.request()
  }
}
