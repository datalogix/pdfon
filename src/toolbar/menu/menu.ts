import { Drawer } from '@/tools'
import { ToolbarMenu } from '../toolbar-menu'

export class Menu extends ToolbarMenu {
  constructor(items = [
    [
      'information',
      'resource',
      'library',
    ],
    [
      'open',
      'download',
      'print',
      'presentation',
    ],
    [
      'current-page',
      'first-page',
      'last-page',
    ],
    [
      'cursor-select',
      'cursor-hand',
    ],
    [
      'spread-none',
      'spread-even',
      'spread-odd',
    ],
    [
      'rotate-cw',
      'rotate-ccw',
    ],
    [
      'scroll-page',
      'scroll-vertical',
      'scroll-horizontal',
      'scroll-wrapped',
    ],
  ]) {
    super(items)
  }

  protected drawer = new Drawer({
    position: 'right',
    backdrop: false,
    classes: 'menu-drawer',
    onClose: () => this.close(),
  })

  async initialize() {
    await super.initialize()

    if (this.menu) {
      this.container.removeChild(this.menu)
      this.rootContainer.append(this.drawer.render(this.menu))
    }
  }

  open() {
    super.open()
    this.drawer.open()
  }

  close() {
    super.close()
    this.drawer.close()
  }
}
