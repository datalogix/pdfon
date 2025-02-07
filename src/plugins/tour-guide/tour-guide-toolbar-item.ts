import { ToolbarAction } from '@/toolbar'
import { TourGuidePlugin } from './tour-guide-plugin'

export class TourGuideToolbarItem extends ToolbarAction {
  get tourGuide() {
    return this.viewer.getLayerProperty<TourGuidePlugin>('TourGuidePlugin')?.tourGuide
  }

  get enabled() {
    return true
  }

  protected execute() {
    this.tourGuide?.start()
  }
}
