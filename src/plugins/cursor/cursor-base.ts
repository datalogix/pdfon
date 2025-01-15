import { CursorTool, type CursorPlugin } from '@/plugins'
import { ToolbarAction } from '@/toolbar'

export abstract class CursorBase extends ToolbarAction {
  protected abstract value: CursorTool

  get current() {
    return this.viewer.getLayerProperty<CursorPlugin>('CursorPlugin')?.activeTool
  }

  get enabled() {
    return true
  }

  get activated() {
    return this.current === this.value
  }

  protected init() {
    this.on('cursortoolchanged', ({ disabled }) => {
      this.markAsActivated(disabled)
    })
  }

  protected execute() {
    this.dispatch('switchcursortool', { tool: this.value })
  }
}
