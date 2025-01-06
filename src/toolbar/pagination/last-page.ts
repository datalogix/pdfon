import { ToolbarAction } from '@/toolbar'

export class LastPage extends ToolbarAction {
  get enabled() {
    return this.viewer.currentPageNumber < this.viewer.pagesCount
  }

  protected init() {
    this.on('pagechanging', () => this.toggle())
  }

  protected execute() {
    this.viewer.lastPage()
  }
}
