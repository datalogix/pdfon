import { ScrollMode } from '@/enums'
import { ScrollBase } from './scroll-base'

export class ScrollHorizontal extends ScrollBase {
  protected value = ScrollMode.HORIZONTAL
}
