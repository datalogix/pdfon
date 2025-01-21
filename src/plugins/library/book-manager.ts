import { Dispatcher, type EventBus } from '@/bus'
import type { Book, BookId } from './book'

export class BookManager extends Dispatcher {
  protected books: Book[] = []
  protected currentBook?: Book

  constructor(readonly eventBus: EventBus) {
    super()
  }

  get length() {
    return this.books.length
  }

  get all() {
    return this.books
  }

  get current() {
    return this.currentBook
  }

  set(books: Book[]) {
    this.books = books
    this.dispatch('books', { books })
  }

  find(bookId: BookId) {
    return this.books.find(book => book.id.toString() === bookId.toString())
  }

  select(book?: Book | BookId) {
    book = typeof book === 'number' || typeof book === 'string'
      ? this.find(book)
      : book

    if (this.current?.id === book?.id) {
      return
    }

    this.currentBook = book
    this.dispatch('book', { book })
  }

  destroy() {
    this.books = []
    this.currentBook = undefined
  }
}
