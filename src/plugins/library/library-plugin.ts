import { Plugin, type ToolbarItemType } from '../plugin'
import { LibraryToolbarItem } from './library-toolbar-item'
import type { Book } from './book'
import type { InformationItem } from '@/toolbar'

export class LibraryPlugin extends Plugin {
  protected getToolbarItems() {
    return new Map<string, ToolbarItemType>([
      ['library', LibraryToolbarItem],
    ])
  }

  private _books: Book[] = []
  private _book?: Book

  get books() {
    return this._books
  }

  set books(books) {
    this._books = books
    this.dispatch('books', { books })
  }

  get book() {
    return this._book
  }

  set book(book) {
    if (this.book?.id === book?.id) {
      return
    }

    this._book = book
    this.dispatch('book', { book })
  }

  protected init() {
    this.on('documentopen', ({ documentType }) => {
      if (documentType !== this.book?.src) {
        this.book = undefined
      }
    })

    this.on('documenttitleupdated', () => {
      if (this.book) {
        document.title = this.book.name
      }
    })

    this.on('book', ({ book }) => {
      if (book) {
        this.viewer.openDocument(book.src)
      }

      this.setBookInformation(book)
    })
  }

  protected setBookInformation(book?: Book) {
    const informations = new Map<string, InformationItem>([])

    if (book) {
      ['name', 'pages', 'sku', 'author', 'description'].forEach((key, index) => {
        informations.set(key, {
          name: this.l10n.get(`library.book.${key}`),
          value: book[key],
          order: index + 1,
        })
      })
    }

    this.dispatch('informationupdate', ({ informations }))
  }
}
