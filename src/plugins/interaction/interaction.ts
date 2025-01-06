export type Interaction = {
  id: string | number
  title?: string
  page: number
  type: 'image' | 'audio' | 'video' | 'question' | 'link' | 'iframe' | 'text'
  x: number
  y: number
  content: string
  completed?: boolean
}
