import { ScrollMode } from '@/enums'
import { ScrollBase } from './scroll-base'

export class ScrollWrapped extends ScrollBase {
  protected value = ScrollMode.WRAPPED
}
