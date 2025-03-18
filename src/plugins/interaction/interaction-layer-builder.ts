import { LayerBuilder } from '@/viewer'
import { createElement } from '@/utils'
import type { InteractionPlugin } from './interaction-plugin'
import { createInteractionButton, type Interaction } from './interaction'

export class InteractionLayerBuilder extends LayerBuilder {
  get interactionManager() {
    return this.layerProperties.getLayerProperty<InteractionPlugin>('InteractionPlugin')?.interactionManager
  }

  protected build() {
    this.create('interaction-layer', 5)
    this.on('Interactions', () => this.renderInteractions())
    this.on('InteractionDestroy', () => this.clearInteractions())
    this.renderInteractions()
  }

  protected renderInteractions() {
    this.clearInteractions()

    this.interactionManager?.getByPage(this.id)?.forEach((interaction) => {
      this.renderInteraction(interaction)
    })
  }

  protected renderInteraction(interaction: Interaction) {
    const button = createInteractionButton(interaction)
    button.addEventListener('click', () => this.interactionManager?.select(interaction))
    button.appendChild(createElement('span', 'interaction-animation'))

    this.on(`InteractionUpdated${interaction.id}`, () => {
      button.classList.remove('interaction-uncompleted')
      button.classList.add('interaction-completed')
    })

    this.div!.appendChild(button)
  }

  protected clearInteractions() {
    this.div!.innerHTML = ''
  }
}
