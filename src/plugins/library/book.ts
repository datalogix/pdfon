import { Interaction } from '../interaction'
import { Resource } from '../resource'

export type BookId = string | number

export type Book = {
  [key: string]: any
  id: BookId
  name: string
  src: string
  cover?: string
  isbn?: string
  sku?: string
  author?: string
  description?: string
  interactions_count?: number
  resources_count?: number
  interactions?: Interaction[] | ((book: Book) => Interaction[] | Promise<Interaction[]>)
  resources?: Resource[] | ((book: Book) => Resource[] | Promise<Resource[]>)
}
