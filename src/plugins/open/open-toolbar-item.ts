import { ToolbarAction } from '@/toolbar'

export class OpenToolbarItem extends ToolbarAction {
  get enabled() {
    return true
  }

  protected init() {
    this.on('documenterror', () => this.enable())
    this.enable()
  }

  protected execute() {
    this.dispatch('openfile')
  }
}
