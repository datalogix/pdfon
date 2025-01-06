import { ToolbarAction } from '@/toolbar'

export class CurrentPage extends ToolbarAction {
  get enabled() {
    return this.viewer.pagesCount > 0
  }

  protected execute() {
    window.location.href = this.viewer.getAnchorUrl()
  }
}
