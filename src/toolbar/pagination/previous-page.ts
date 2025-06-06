import { ToolbarAction } from '@/toolbar'

export class PreviousPage extends ToolbarAction {
  get enabled() {
    return this.viewer.hasPreviousPage()
  }

  protected init() {
    this.on('PageChanging', () => this.toggle())
  }

  protected execute() {
    this.viewer.previousPage()
  }
}
