import { ToolbarAction } from '@/toolbar'
import { type CursorPlugin, CursorTool } from './cursor-plugin'

export abstract class CursorBaseToolbarItem extends ToolbarAction {
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
    this.on('CursorToolChanged', ({ disabled }) => {
      if (!disabled) {
        this.markAsActivated()
      }
    })
  }

  protected execute() {
    this.dispatch('SwitchCursorTool', { tool: this.value })
  }
}
