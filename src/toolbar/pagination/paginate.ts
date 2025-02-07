import { ToolbarGroup } from '@/toolbar'
import { NextPage } from './next-page'
import { PreviousPage } from './previous-page'
import { InputPage } from './input-page'

export class Paginate extends ToolbarGroup {
  constructor() {
    super([
      new PreviousPage(),
      new NextPage(),
      new InputPage(),
    ])
  }
}
