import { Plugin } from '../plugin'
import { StoragePlugin } from '../storage'
import { Interaction } from './interaction'
import { InteractionLayerBuilder } from './interaction-layer-builder'
import { InteractionService } from './interaction-service'

export class InteractionPlugin extends Plugin {
  private _interactionService?: InteractionService

  get interactionService() {
    return this._interactionService
  }

  get storage() {
    return this.viewer.getLayerProperty<StoragePlugin>('StoragePlugin')?.storage
  }

  protected init() {
    this.viewer.addLayerBuilder(InteractionLayerBuilder)
    this._interactionService = new InteractionService()

    this.on('documentdestroy', () => this.interactionService?.destroy())
    this.on('storageinitialized', () => this.dispatch('interactionload'))

    this.on('interactionload', ({ interactions }) => {
      const stored: Interaction[] | undefined = this.storage?.get('interactions')

      if (interactions && stored) {
        interactions = (interactions as Interaction[]).map(interaction => ({
          ...interaction,
          completed: interaction.completed ? interaction.completed : stored.find(i => i.id === interaction.id)?.completed,
        }))
      }

      this.interactionService?.load(interactions ?? stored)
      this.dispatch('interactionloaded', { interactions: this.interactionService?.all() })
    })

    this.on(['interactionloaded', 'interactionupdated'], () => {
      this.storage?.set('interactions', this.interactionService?.all())

      this.dispatch('informationadd', {
        key: 'interactions',
        information: {
          name: this.l10n.get('interaction.title'),
          value: this.interactionService?.completed.length || 0,
          total: this.interactionService?.all().length,
          order: 4,
        },
      })
    })

    this.on('interactionclick', ({ interaction }) => {
      interaction.completed = true
      this.setCurrentPage(interaction.page)
      this.interactionService?.open(interaction)
      this.dispatch(`interactionupdated${interaction.id}`, { interaction })
      this.dispatch('interactionupdated', { interaction })
    })
  }

  protected destroy() {
    this.viewer.removeLayerBuilder(InteractionLayerBuilder)
    this._interactionService?.destroy()
    this._interactionService = undefined
  }
}
