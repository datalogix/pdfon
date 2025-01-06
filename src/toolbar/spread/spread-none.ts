import { SpreadMode } from '@/enums'
import { SpreadBase } from './spread-base'

export class SpreadNone extends SpreadBase {
  protected value = SpreadMode.NONE
}
