import { Plugin, type ToolbarItemType } from '../plugin'
import type { StoragePlugin } from '../storage'
import type { Resource } from './resource'
import { ResourceInitializer } from './resource-initializer'
import { ResourceManager } from './resource-manager'
import { ResourceToolbarItem } from './resource-toolbar-item'

export type ResourcePluginParams = {
  resources?: Resource[]
}

export class ResourcePlugin extends Plugin<ResourcePluginParams> {
  protected initializers = [ResourceInitializer]

  protected getToolbarItems() {
    return new Map<string, ToolbarItemType>([
      ['resource', ResourceToolbarItem],
    ])
  }

  private _resourceManager?: ResourceManager

  get resourceManager() {
    return this._resourceManager
  }

  get storage() {
    return this.viewer.getLayerProperty<StoragePlugin>('StoragePlugin')?.storage
  }

  protected init() {
    this._resourceManager = new ResourceManager(this.eventBus)

    this.on('DocumentDestroy', () => this._resourceManager?.destroy())
    this.on('StorageLoaded', () => this.dispatch('ResourceLoad'))
    this.on('ResourceLoad', ({ resources }) => this._resourceManager?.set(resources ?? this.storage?.get('resources') ?? []))
    this.on('Resources', ({ resources }) => this.storage?.set('resources', resources))
  }

  protected onLoad() {
    if (this.resolvedParams?.resources) {
      this._resourceManager?.set(this.resolvedParams.resources)
    }
  }

  protected destroy() {
    this._resourceManager?.destroy()
    this._resourceManager = undefined
  }
}
