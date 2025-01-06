import { ToolbarAction } from '@/toolbar'

export class FirstPage extends ToolbarAction {
  get enabled() {
    return this.viewer.currentPageNumber > 1
  }

  protected init() {
    this.on('pagechanging', () => this.toggle())
  }

  protected execute() {
    this.viewer.firstPage()
  }
}
