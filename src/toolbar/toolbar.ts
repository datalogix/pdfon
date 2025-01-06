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
  protected readonly _items = new Map<string, ToolbarItem>()

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

  protected createGroups(): Map<string, ToolbarItem>[] {
    const toolbarConfig = this.options?.toolbar ?? []

    return toolbarConfig.map((groupConfig) => {
      const items = new Map<string, ToolbarItem>()
      const validKeys = this.getValidKeys(groupConfig)
      validKeys.forEach(key => items.set(key, this.resolveToolbarItem(key)))
      return items
    })
  }

  protected getValidKeys(groupConfig: string): string[] {
    return groupConfig.split(' ').filter(key => this.list.has(key))
  }

  protected resolveToolbarItem(key: string): ToolbarItem {
    const item = this.list.get(key)!

    const toolbarItem = typeof item === 'function'
      ? new item()
      : item as ToolbarItem

    toolbarItem.setToolbar(this)

    return toolbarItem
  }

  async initialize() {
    for (const groupItems of this.createGroups()) {
      const group = createElement('div', 'toolbar-group')

      for (const [key, item] of groupItems) {
        await item.initialize()
        this.items.set(key, item)
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
    for (const item of this.items.values()) {
      await item.terminate()
    }

    this.container.remove()
    this.dispatch('toolbardestroy')
  }
}
