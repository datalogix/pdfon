import { Modal } from '@/tools'
import { dragElement } from '@/utils'
import { LayerBuilder } from '@/viewer'
import { createInteractionButton, openInteraction, type InteractionType, type Interaction } from '../interaction'
import type { InteractionEditorPlugin } from './interaction-editor-plugin'
import { createInteractionForm } from './interaction-form'

export class InteractionEditorLayerBuilder extends LayerBuilder {
  get interactionEditorManager() {
    return this.layerProperties.getLayerProperty<InteractionEditorPlugin>('InteractionEditorPlugin')?.interactionEditorManager
  }

  protected build() {
    const div = this.create('interaction-editor-layer', 1)
    div.addEventListener('click', e => this.createInteraction(this.id, e.offsetX, e.offsetY))

    this.on('DocumentDestroy', () => this.clearInteractions())
    this.renderInteractions()
  }

  protected createInteraction(page: number, x: number, y: number) {
    const form = createInteractionForm()

    form.onSubmit(formData => this.interactionEditorManager!.add({
      page,
      x,
      y,
      type: formData.get('type') as InteractionType,
      content: formData.get('content')!,
      title: formData.has('title') ? formData.get('title') as string : undefined,
    }))

    form.onSuccess((interaction: Interaction) => {
      this.renderInteraction(interaction)
      Modal.close()
    })

    Modal.open(form.render(), {
      title: 'Nova interação',
      backdrop: 'blur',
    }).classList.add('interaction-editor-modal')
  }

  protected renderInteractions() {
    this.clearInteractions()
    this.interactionEditorManager?.getByPage(this.id)?.forEach(interaction => this.renderInteraction(interaction))
  }

  protected renderInteraction(interaction: Interaction) {
    const button = createInteractionButton(interaction, true, false)
    button.addEventListener('click', e => e.stopPropagation())
    button.addEventListener('dblclick', () => openInteraction(interaction))

    dragElement(button, {
      threshold: 3,
      onStop: (_event, x, y) => this.interactionEditorManager?.update(interaction, x, y),
    })

    this.div!.appendChild(button)
  }

  protected clearInteractions() {
    this.div!.innerHTML = ''
  }
}
