import type { InformationPlugin } from '../information'
import { Plugin } from '../plugin'
import type { SidebarPlugin } from '../sidebar'
import type { StoragePlugin } from '../storage'
import type { Interaction, InteractionId } from './interaction'
import { InteractionLayerBuilder } from './interaction-layer-builder'
import { InteractionManager } from './interaction-manager'
import { InteractionSidebarItem } from './interaction-sidebar-item'

export type InteractionPluginParams = {
  interactions?: Interaction[]
  interactionId?: InteractionId
}

export class InteractionPlugin extends Plugin<InteractionPluginParams> {
  protected layerBuilders = [InteractionLayerBuilder]
  private _interactionManager?: InteractionManager
  private interactionSidebarItem = new InteractionSidebarItem()

  get interactionManager() {
    return this._interactionManager
  }

  get storage() {
    return this.viewer.getLayerProperty<StoragePlugin>('StoragePlugin')?.storage
  }

  get sidebarManager() {
    return this.viewer.getLayerProperty<SidebarPlugin>('SidebarPlugin')?.sidebarManager
  }

  get informationManager() {
    return this.viewer.getLayerProperty<InformationPlugin>('InformationPlugin')?.informationManager
  }

  protected init() {
    this._interactionManager = new InteractionManager(this.eventBus)

    this.on('DocumentDestroy', () => this._interactionManager?.destroy())
    this.on('StorageLoaded', () => this.dispatch('InteractionLoad'))
    this.on('InteractionClick', ({ interaction }) => this.setCurrentPage(interaction.page))

    this.on('InteractionLoad', ({ interactions }) => {
      const stored: Interaction[] | undefined = this.storage?.get('interactions')

      if (interactions && stored) {
        interactions = (interactions as Interaction[]).map(interaction => ({
          ...interaction,
          completed: interaction.completed ? interaction.completed : stored.find(i => i.id === interaction.id)?.completed,
        }))
      }

      this._interactionManager?.set(interactions ?? stored ?? [])
    })

    this.on(['Interactions', 'InteractionUpdated'], () => {
      this.storage?.set('interactions', this._interactionManager?.all)
      this.informationManager?.add({
        name: this.translate('title'),
        value: this._interactionManager?.completed.length || 0,
        total: this._interactionManager?.length,
        order: 4,
      })
    })
  }

  protected onLoad() {
    this.sidebarManager?.add(this.interactionSidebarItem)

    if (this.resolvedParams?.interactions) {
      this._interactionManager?.set(this.resolvedParams.interactions)
    }

    if (this.resolvedParams?.interactionId) {
      queueMicrotask(() => this._interactionManager?.select(this.resolvedParams?.interactionId))
    }
  }

  protected destroy() {
    this.sidebarManager?.delete(this.interactionSidebarItem)
    this._interactionManager?.destroy()
    this._interactionManager = undefined
  }
}
