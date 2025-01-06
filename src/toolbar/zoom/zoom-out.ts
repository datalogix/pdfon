import { MIN_SCALE } from '@/config'
import { ToolbarAction } from '@/toolbar'

export class ZoomOut extends ToolbarAction {
  get enabled() {
    return this.viewer.currentScale > MIN_SCALE
  }

  protected init() {
    this.on('scalechanging', () => this.toggle())
  }

  protected execute() {
    this.viewer.zoomOut()
  }
}
