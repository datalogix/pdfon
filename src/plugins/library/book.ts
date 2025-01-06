export type Book = {
  [x: string]: any
  id: string | number
  name: string
  src: string
  cover?: string
  pages?: number
  isbn?: string
  sku?: string
  author?: string
  description?: string
}
