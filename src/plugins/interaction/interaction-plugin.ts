import { Plugin } from '../plugin'
import { InteractionLayerBuilder } from './interaction-layer-builder'
import { InteractionService } from './interaction-service'

export class InteractionPlugin extends Plugin {
  private _interactionService?: InteractionService

  get interactionService() {
    return this._interactionService
  }

  protected init() {
    this.viewer.addLayerBuilder(InteractionLayerBuilder)
    this._interactionService = new InteractionService()

    this.on('book', ({ book }) => {
      this.on('documentload', () => {
        this.dispatch('interactionload', { interactions: book?.interactions })
      })
    })

    this.on('documentdestroy', () => this._interactionService?.destroy())

    this.on('interactionload', ({ interactions }) => {
      this._interactionService?.load(interactions)
      this.dispatch('interactionloaded', { interactions })
    })

    this.on(['interactionloaded', 'interactionupdated'], () => {
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

    this.on('interactionselect', ({ interaction }) => {
      interaction.completed = true
      this.setCurrentPage(interaction.page)
      this._interactionService?.open(interaction)
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
