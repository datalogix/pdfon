import { Modal } from '@/tools'
import { createElement, dragElement } from '@/utils'
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
    div.addEventListener('click', (e) => {
      const pos = this.calculatePosition(e.offsetX, e.offsetY)
      this.createInteraction(this.id, pos.x, pos.y)
    })

    this.on('InteractionsEditor', () => this.renderInteractions())
    this.on('InteractionEditorAdded', ({ interaction }) => this.renderInteraction(interaction))
    this.on(['InteractionEditorAdded', 'InteractionEditorDeleted'], () => Modal.close())
    this.on('DocumentDestroy', () => this.clearInteractions())
    this.renderInteractions()
  }

  protected createInteraction(page: number, x: number, y: number) {
    const form = createInteractionForm({
      onSubmit: formData => this.interactionEditorManager!.add({
        page,
        x,
        y,
        type: formData.get('type') as InteractionType,
        content: formData.get('content')!,
        title: formData.has('title') ? formData.get('title') as string : undefined,
      }),
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
    button.addEventListener('dblclick', () => {
      const removeButton = createElement('button', 'interaction-editor-remove', { type: 'button' })
      removeButton.addEventListener('click', () => {
        if (!confirm(this.l10n.get('plugins.interaction-editor.remove-confirm'))) {
          return
        }

        button.remove()
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
