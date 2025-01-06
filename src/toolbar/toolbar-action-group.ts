import { ToolbarMenu, type ToolbarMenuActions } from './toolbar-menu'

export abstract class ToolbarActionGroup extends ToolbarMenu {
  constructor(readonly actions: ToolbarMenuActions) {
    super(actions)

    this.container.classList.add('toolbar-action-group')
  }

  protected markAsActivated() {
    this.actions.flat().forEach((action) => {
      this.container.classList.remove(action.className)
      action.show()

      if (action.activated) {
        this.container.classList.add(action.className)
        action.hide()
      }
    })
  }
}
