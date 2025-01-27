import type { ViewerType } from '@/viewer'
import type { ToolbarItem, ToolbarItemType } from '@/toolbar'
import { createElement } from '@/utils'
import { Dispatcher } from '@/bus'

export type ToolbarOptions = {
  container?: HTMLDivElement
  toolbar?: string[]
}

export class Toolbar extends Dispatcher {
  readonly container: HTMLDivElement
  protected readonly list = new Map<string, ToolbarItemType>()
  protected readonly _items = new Set<ToolbarItem>()

  constructor(
    readonly viewer: ViewerType,
    readonly options?: ToolbarOptions,
  ) {
    super()
    this.container = options?.container ?? createElement('div')
    this.container.classList.add('toolbar')
  }

  get rootContainer() {
    return this.container.parentElement ?? this.container
  }

  get eventBus() {
    return this.viewer.eventBus
  }

  get items() {
    return this._items
  }

  register(name: string, item: ToolbarItemType) {
    this.list.set(name, item)
  }

  protected createGroups() {
    const toolbarConfig = this.options?.toolbar ?? []

    return toolbarConfig.map((groupConfig) => {
      const items = new Set<ToolbarItem>()
      const validKeys = this.getValidNames(groupConfig)
      validKeys.forEach(name => items.add(this.resolveToolbarItem(name)))
      return items
    })
  }

  protected getValidNames(groupConfig: string) {
    return groupConfig.split(' ').filter(name => this.list.has(name))
  }

  resolveToolbarItem(name: string) {
    const item = this.list.get(name)!

    const toolbarItem = typeof item === 'function'
      ? new item()
      : item as ToolbarItem

    toolbarItem.setToolbar(this)

    return toolbarItem
  }

  async initialize() {
    for (const groupItems of this.createGroups()) {
      const group = createElement('div', 'toolbar-group')

      for (const item of groupItems) {
        await item.initialize()
        this._items.add(item)
        group.appendChild(item.render())
      }

      this.container.appendChild(group)
    }

    this.dispatch('toolbarinit')
  }

  render() {
    return this.container
  }

  async terminate() {
    for (const item of this._items) {
      await item.terminate()
    }

    this.container.remove()
    this.dispatch('toolbardestroy')
  }
}
