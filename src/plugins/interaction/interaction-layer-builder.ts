import { LayerBuilder } from '@/viewer'
import { createElement } from '@/utils'
import type { InteractionPlugin } from './interaction-plugin'

export class InteractionLayerBuilder extends LayerBuilder {
  get interactionManager() {
    return this.layerProperties.getLayerProperty<InteractionPlugin>('InteractionPlugin')?.interactionManager
  }

  protected async build() {
    const div = this.create('interaction-layer', 5)

    this.interactionManager?.getByPage(this.id)?.forEach((interaction) => {
      const button = createElement('button', [
        'interaction',
        `interaction-${interaction.type.toLowerCase()}`,
        `interaction-${interaction.completed ? 'completed' : 'uncompleted'}`,
      ], { type: 'button' })

      button.style.top = `calc(${interaction.y}px * var(--scale-factor))`
      button.style.left = `calc(${interaction.x}px * var(--scale-factor))`
      button.addEventListener('click', () => this.interactionManager?.select(interaction))
      button.appendChild(createElement('span', 'interaction-animation'))

      this.on(`interactionupdated${interaction.id}`, () => {
        button.classList.remove('interaction-uncompleted')
        button.classList.add('interaction-completed')
      })

      div.appendChild(button)
    })
  }
}
