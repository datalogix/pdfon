export type Book = {
  [x: string]: any
  id: string | number
  name: string
  src: string
  cover?: string
  isbn?: string
  sku?: string
  author?: string
  description?: string
}
