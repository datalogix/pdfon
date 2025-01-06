import { SpreadMode } from '@/enums'
import { SpreadBase } from './spread-base'

export class SpreadEven extends SpreadBase {
  protected value = SpreadMode.EVEN
}
