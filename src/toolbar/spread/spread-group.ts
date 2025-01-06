import { ScrollMode } from '@/enums'
import { ToolbarActionGroup } from '@/toolbar'
import { SpreadNone } from './spread-none'
import { SpreadOdd } from './spread-odd'
import { SpreadEven } from './spread-even'

export class SpreadGroup extends ToolbarActionGroup {
  constructor() {
    super ([
      new SpreadNone(),
      new SpreadEven(),
      new SpreadOdd(),
    ])
  }

  get enabled() {
    return this.viewer.scrollMode !== ScrollMode.HORIZONTAL
  }

  protected init() {
    this.on('scrollmodechanged', () => this.toggle())
    this.on('spreadmodechanged', () => this.markAsActivated())
  }
}
