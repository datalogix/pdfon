import { MAX_SCALE } from '@/config'
import { ToolbarAction } from '@/toolbar'

export class ZoomIn extends ToolbarAction {
  get enabled() {
    return this.viewer.currentScale < MAX_SCALE
  }

  protected init() {
    this.on('scalechanging', () => this.toggle())
  }

  protected execute() {
    this.viewer.zoomIn()
  }
}
