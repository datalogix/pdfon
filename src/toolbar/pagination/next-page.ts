import { ToolbarAction } from '@/toolbar'

export class NextPage extends ToolbarAction {
  get enabled() {
    return this.viewer.hasNextPage()
  }

  protected init() {
    this.on('pagechanging', () => this.toggle())
  }

  protected execute() {
    this.viewer.nextPage()
  }
}
