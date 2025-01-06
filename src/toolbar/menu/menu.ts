import * as plugins from '@/plugins'
import * as toolbar from '@/toolbar'

export class Menu extends toolbar.ToolbarMenu {
  constructor(actions = [
    [
      new toolbar.Information(),
      new toolbar.Resource(),
      new plugins.LibraryToolbarItem(),
    ],
    [
      new plugins.OpenToolbarItem(),
      new plugins.DownloadToolbarItem(),
      new plugins.PrintToolbarItem(),
      new plugins.PresentationToolbarItem(),
    ],
    [
      new toolbar.CurrentPage(),
      new toolbar.FirstPage(),
      new toolbar.LastPage(),
    ],
    [
      new plugins.CursorSelect(),
      new plugins.CursorHand(),
    ],
    [
      new toolbar.SpreadNone(),
      new toolbar.SpreadEven(),
      new toolbar.SpreadOdd(),
    ],
    [
      new toolbar.RotateCw(),
      new toolbar.RotateCcw(),
    ],
    [
      new toolbar.ScrollPage(),
      new toolbar.ScrollVertical(),
      new toolbar.ScrollHorizontal(),
      new toolbar.ScrollWrapped(),
    ],
  ]) {
    super(actions)
  }

  async initialize() {
    await super.initialize()

    this.toggle(true)

    this.on('pagesdestroy', () => this.toggle(true))
  }
}
