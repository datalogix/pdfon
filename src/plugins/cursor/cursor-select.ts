import { CursorTool } from '@/plugins'
import { CursorBase } from './cursor-base'

export class CursorSelect extends CursorBase {
  protected value = CursorTool.SELECT
}
