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
}
