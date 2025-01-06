import { ScrollMode } from '@/enums'
import { ScrollBase } from './scroll-base'

export class ScrollPage extends ScrollBase {
  protected value = ScrollMode.PAGE
}
