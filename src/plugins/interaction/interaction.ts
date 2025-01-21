export type InteractionId = string | number

export type Interaction = {
  id: InteractionId
  title?: string
  page: number
  type: 'image' | 'audio' | 'video' | 'question' | 'link' | 'iframe' | 'text'
  x: number
  y: number
  content: string
  completed?: boolean
}
