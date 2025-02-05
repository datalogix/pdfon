import { ToolbarAction } from './toolbar-action'

export abstract class ToolbarActionToggle extends ToolbarAction {
  protected _opened = false

  get opened() {
    return this._opened
  }

  set opened(value) {
    this._opened = value
    this.markAsActivated()
  }

  get enabled() {
    return true
  }

  get activated() {
    return this._opened
  }

  open() {
    //
  }

  close() {
    //
  }

  protected execute() {
    this.opened = !this.opened

    if (this.opened) {
      this.open()
      this.dispatch(`${this.name}open`)
    } else {
      this.close()
      this.dispatch(`${this.name}close`)
    }

    this.dispatch(`${this.name}toggle`, { opened: this.opened })
  }

  disable() {
    super.disable()
    this.opened = false
    this.close()
  }
}
