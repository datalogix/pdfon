import { Modal } from '@/tools'
import { createElement } from '@/utils'

export type InteractionId = string | number

export type InteractionType = 'image' | 'audio' | 'video' | 'question' | 'link' | 'iframe' | 'text'

export type Interaction = {
  id: InteractionId
  title?: string
  page: number
  type: InteractionType
  x: number
  y: number
  content: string
  completed?: boolean
}

export type InteractionCreate = Omit<Interaction, 'id' | 'content'> & { content: string | File }

export function createInteractionButton(interaction: Interaction, positions: boolean = true, completed: boolean = true) {
  const button = createElement('button', [
    'interaction',
    `interaction-${interaction.type.toLowerCase()}`,
    completed ? `interaction-${interaction.completed ? 'completed' : 'uncompleted'}` : undefined,
  ], { type: 'button' })

  if (positions) {
    button.style.left = `calc(${interaction.x}px * var(--scale-factor))`
    button.style.top = `calc(${interaction.y}px * var(--scale-factor))`
  }

  return button
}

export function openInteraction(interaction: Interaction) {
  const html = 'foo' as any
  const isIframe = html instanceof HTMLIFrameElement

  Modal.open(html, {
    title: interaction.title,
    draggable: !isIframe,
    backdrop: isIframe ? 'blur' : false,
  }).classList.add('interaction-modal')
}
