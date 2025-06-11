import { Modal } from '@/tools'
import { createElement, dragElement } from '@/utils'
import { LayerBuilder } from '@/viewer'
import { createInteractionButton, openInteraction, type Interaction } from '../interaction'
import { InteractionEditorPlugin } from './interaction-editor-plugin'
import { createInteractionForm } from './interaction-form'

export class InteractionEditorLayerBuilder extends LayerBuilder {
  get interactionEditorPlugin() {
    return this.layerProperties.getLayerProperty<InteractionEditorPlugin>('InteractionEditorPlugin')
  }

  get interactionEditorManager() {
    return this.interactionEditorPlugin?.interactionEditorManager
  }

  protected build() {
    const div = this.create('interaction-editor-layer', 1)
    div.addEventListener('click', (e) => {
      const pos = this.calculatePosition(e.offsetX, e.offsetY)
      this.createInteraction(this.id, pos.x, pos.y)
    })

    this.on('InteractionsEditor', () => this.renderInteractions())
    this.on(`InteractionEditorAddedOnPage${this.id}`, ({ interaction }) => {
      this.renderInteraction(interaction)
      Modal.close()
    })
    this.on('DocumentDestroy', () => this.clearInteractions())
    this.renderInteractions()
  }

  protected createInteraction(page: number, x: number, y: number) {
    const form = createInteractionForm(
      InteractionEditorPlugin.interactionTypes,
      this.interactionEditorPlugin!.translator,
      {
        onSubmit: formData => this.interactionEditorManager?.add({
          page,
          x,
          y,
          type: formData.get('type') as string,
          content: formData.get('content')!,
          title: formData.has('title') ? formData.get('title') as string : undefined,
        }),
      },
    )

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
    button.addEventListener('dblclick', () => {
      const removeButton = createElement('button', 'interaction-editor-remove', { type: 'button' })
      removeButton.addEventListener('click', () => {
        if (!confirm(this.interactionEditorPlugin?.translate('remove-confirm'))) {
          return
        }

        button.remove()
        Modal.close()
        this.interactionEditorManager?.delete(interaction)
      })

      openInteraction(interaction).append(removeButton)
    })

    dragElement(button, {
      parent: this.div,
      threshold: 3,
      onStop: (_event, x, y) => {
        const pos = this.calculatePosition(x, y)

        this.interactionEditorManager?.update(
          interaction.id,
          pos.x,
          pos.y,
        )
      },
    })

    this.div!.appendChild(button)
  }

  protected calculatePosition(x: number, y: number) {
    const { pageWidth, pageHeight } = this.viewport.rawDims as { pageWidth: number, pageHeight: number }

    return {
      x: pageWidth * (x / this.page.width),
      y: pageHeight * (y / this.page.height),
    }
  }

  protected clearInteractions() {
    this.div!.innerHTML = ''
  }
}
