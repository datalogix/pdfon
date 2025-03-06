import { ToolbarAction } from '@/toolbar'
import { TourPlugin } from './tour-plugin'

export class TourToolbarItem extends ToolbarAction {
  get tour() {
    return this.viewer.getLayerProperty<TourPlugin>('TourPlugin')?.tour
  }

  get enabled() {
    return true
  }

  protected execute() {
    this.tour?.start()
  }
}
