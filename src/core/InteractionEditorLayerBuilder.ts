import { createElement, dragElement } from '@/utils'
import { LayerBuilder } from '@/viewer'

export class InteractionEditorLayerBuilder extends LayerBuilder {
  protected build() {
    const div = this.create('interaction-editor-layer', 1)

    div.addEventListener('click', (e) => {
      const button = createElement('button', [
        'interaction',
        'interaction-video',
      ], { type: 'button' })

      button.style.top = `${e.offsetY}px`
      button.style.left = `${e.offsetX}px`

      button.addEventListener('click', e => e.stopPropagation())
      // button.appendChild(createElement('span', 'interaction-animation'))

      dragElement(button, {
        onStop: () => {
          console.log('save')
        },
      })

      div.appendChild(button)
    })
  }
}
