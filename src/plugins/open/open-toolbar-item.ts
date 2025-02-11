import { ToolbarAction } from '@/toolbar'

export class OpenToolbarItem extends ToolbarAction {
  get enabled() {
    return true
  }

  protected init() {
    this.on('DocumentError', () => this.enable())

    this.enable()
  }

  protected execute() {
    this.dispatch('OpenFile')
  }
}
