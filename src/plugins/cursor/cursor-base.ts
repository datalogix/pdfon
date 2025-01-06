import { CursorTool } from '@/plugins'
import { ToolbarAction } from '@/toolbar'

export abstract class CursorBase extends ToolbarAction {
  protected current = CursorTool.SELECT
  protected abstract value: CursorTool

  get enabled() {
    return true
  }

  get activated() {
    return this.current === this.value
  }

  protected init() {
    this.on('switchcursortool', ({ tool }) => {
      this.current = tool
      this.markAsActivated()
    })
  }

  protected execute() {
    this.dispatch('switchcursortool', { tool: this.value })
  }
}
