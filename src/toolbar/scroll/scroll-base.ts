import { FORCE_SCROLL_MODE_PAGE } from '@/config'
import { ScrollMode } from '@/enums'
import { ToolbarAction } from '@/toolbar'

export abstract class ScrollBase extends ToolbarAction {
  protected abstract value: ScrollMode

  get enabled() {
    return this.viewer.pagesCount <= FORCE_SCROLL_MODE_PAGE
  }

  get activated() {
    return this.viewer.scrollMode === this.value
  }

  protected init() {
    this.on('scrollmodechanged', () => this.markAsActivated())
  }

  protected execute() {
    this.viewer.scrollMode = this.value
  }
}
