import { ToolbarAction } from '@/toolbar'

export class RotateCw extends ToolbarAction {
  get enabled() {
    return this.viewer.pagesCount > 0
  }

  protected execute() {
    this.viewer.rotation += 90
  }
}
