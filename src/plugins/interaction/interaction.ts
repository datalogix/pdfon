import { Modal } from '@/tools'
import { createElement, parseContent } from '@/utils'

export type InteractionId = string | number

export type Interaction = {
  id: InteractionId
  title?: string
  page: number
  type: string
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
  ], { type: 'button', id: `interaction-${interaction.id}` })

  if (positions) {
    button.style.left = `calc(${interaction.x}px * var(--scale-factor))`
    button.style.top = `calc(${interaction.y}px * var(--scale-factor))`
  }

  return button
}

export function openInteraction({ content, type, title }: Interaction) {
  const html = parseContent(type === 'link' ? 'Uma nova janela será aberta, aguarde...' : content)
  const isIframe = html instanceof HTMLIFrameElement
  const modal = Modal.open(html, {
    title,
    draggable: !isIframe,
    backdrop: isIframe ? 'blur' : false,
  })
  modal.classList.add('interaction-modal')

  if (type === 'link') {
    setTimeout(() => window.open(content, '_blank'), 2000)
  }

  return modal
}
