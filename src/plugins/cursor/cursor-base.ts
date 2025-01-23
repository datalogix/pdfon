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
      if (!disabled) this.markAsActivated()
    })
  }

  protected execute() {
    this.dispatch('switchcursortool', { tool: this.value })
  }
}
