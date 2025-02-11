import { ScrollMode, SpreadMode } from '@/enums'
import { ToolbarAction } from '@/toolbar'

export abstract class SpreadBase extends ToolbarAction {
  protected abstract value: SpreadMode

  get enabled() {
    return this.viewer.scrollMode !== ScrollMode.HORIZONTAL
  }

  get activated() {
    return this.viewer.spreadMode === this.value
  }

  protected init() {
    this.on('ScrollModeChanged', () => this.toggle())
    this.on('SpreadModeChanged', () => this.markAsActivated())
  }

  protected execute() {
    this.viewer.spreadMode = this.value
  }
}
