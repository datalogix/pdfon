import { FORCE_SCROLL_MODE_PAGE } from '@/config'
import { ToolbarActionGroup } from '@/toolbar'
import { ScrollHorizontal } from './scroll-horizontal'
import { ScrollWrapped } from './scroll-wrapped'
import { ScrollPage } from './scroll-page'
import { ScrollVertical } from './scroll-vertical'

export class ScrollGroup extends ToolbarActionGroup {
  constructor() {
    super ([
      new ScrollPage(),
      new ScrollVertical(),
      new ScrollHorizontal(),
      new ScrollWrapped(),
    ])
  }

  get enabled() {
    return this.viewer.pagesCount <= FORCE_SCROLL_MODE_PAGE
  }

  protected init() {
    this.on('scrollmodechanged', () => this.markAsActivated())
  }
}
