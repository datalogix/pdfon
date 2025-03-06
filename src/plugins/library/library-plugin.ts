import { deserialize, serialize } from '@/utils'
import type { InformationPlugin } from '../information'
import { Plugin, type ToolbarItemType } from '../plugin'
import { BookManager } from './book-manager'
import type { Book, BookId } from './book'
import { LibraryToolbarItem } from './library-toolbar-item'
import { name } from '../../../package.json'

export type LibraryPluginParams = {
  books?: Book[]
  bookId?: BookId
}

export class LibraryPlugin extends Plugin<LibraryPluginParams> {
  protected getToolbarItems() {
    return new Map<string, ToolbarItemType>([
      ['library', LibraryToolbarItem],
    ])
  }

  private _bookManager?: BookManager

  get bookManager() {
    return this._bookManager
  }

  get informationManager() {
    return this.viewer.getLayerProperty<InformationPlugin>('InformationPlugin')?.informationManager
  }

  protected init() {
    this._bookManager = new BookManager(this.eventBus)

    this.on('DocumentOpen', ({ options }) => {
      if (this._bookManager && options?.book?.id !== this._bookManager.current?.id) {
        this._bookManager.select(undefined)
      }
    })

    this.on('Book', ({ book }) => this.openBook(book))
  }

  private openBook(book: Book) {
    const storageKey = `${name}-${this.name}-${book.id}`
    const document = deserialize(localStorage.getItem(storageKey), book.src)

    this.viewer.openDocument(document, book.name, {
      storageId: book.id,
      interactions: book.interactions,
      resources: book.resources,
      book,
    })

    if (document === book.src) {
      this.on('DocumentInit', async ({ pdfDocument }) => {
        localStorage.setItem(storageKey, serialize(await pdfDocument.getData()))
      }, { once: true })
    }

    const props = ['name', 'sku', 'author', 'description']

    props.forEach((key, index) => {
      this.informationManager?.add({
        name: this.translate(`book.${key}`),
        value: book[key],
        order: index + 1,
      })
    })
  }

  protected onLoad() {
    if (this.resolvedParams?.books) {
      this.bookManager?.set(this.resolvedParams.books)
    }

    if (this.resolvedParams?.bookId) {
      this.on('DocumentEmpty', () => this._bookManager?.select(this.resolvedParams?.bookId), { once: true })
    }
  }

  protected destroy() {
    this._bookManager?.destroy()
    this._bookManager = undefined
  }
}
