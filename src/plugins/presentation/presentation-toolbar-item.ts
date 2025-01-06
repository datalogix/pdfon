import { ToolbarAction } from '@/toolbar'

export class PresentationToolbarItem extends ToolbarAction {
  get enabled() {
    return this.container.ownerDocument.fullscreenEnabled
  }

  protected execute() {
    this.dispatch('presentationrequest')
  }
}
