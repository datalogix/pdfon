import { ToolbarAction } from '@/toolbar'

export class NextPage extends ToolbarAction {
  get enabled() {
    return this.viewer.hasNextPage()
  }

  protected init() {
    this.on('PageChanging', () => this.toggle())
  }

  protected execute() {
    this.viewer.nextPage()
  }
}
