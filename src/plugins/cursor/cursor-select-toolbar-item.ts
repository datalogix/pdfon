import { CursorBaseToolbarItem } from './cursor-base-toolbar-item'
import { CursorTool } from './cursor-plugin'

export class CursorSelectToolbarItem extends CursorBaseToolbarItem {
  protected value = CursorTool.SELECT
}
