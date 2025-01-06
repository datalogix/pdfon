import { ScrollMode } from '@/enums'
import { ScrollBase } from './scroll-base'

export class ScrollVertical extends ScrollBase {
  protected value = ScrollMode.VERTICAL
}
