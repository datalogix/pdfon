import { Plugin } from '../plugin'
import { SidebarInitializer } from './sidebar-initializer'

export class SidebarPlugin extends Plugin {
  protected initializer = new SidebarInitializer()
}
