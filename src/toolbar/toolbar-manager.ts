import { Toolbar, type ToolbarOptions, type ToolbarItemType } from '@/toolbar'
import { ViewerType } from '@/viewer'

export class ToolbarManager {
  private _toolbar?: Toolbar

  constructor(readonly items: Map<string, ToolbarItemType> = new Map()) { }

  get toolbar() {
    return this._toolbar
  }

  add(name: string, item: ToolbarItemType) {
    this.items.set(name, item)
  }

  remove(name: string) {
    this.items.delete(name)
  }

  build(viewer: ViewerType, options: ToolbarOptions) {
    return this._toolbar ||= new Toolbar(viewer, options)
  }

  async initialize() {
    this.items.forEach((item, name) => this.toolbar?.register(name, item))

    await this.toolbar?.initialize()
  }
}
