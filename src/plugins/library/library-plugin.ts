import { getFromCache, saveInCache } from '@/utils'
import type { InformationPlugin } from '../information'
import { Plugin, type ToolbarItemType } from '../plugin'
import { BookManager } from './book-manager'
import type { Book, BookId } from './book'
import { LibraryToolbarItem } from './library-toolbar-item'

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
      if (this._bookManager && options?.id !== this._bookManager.current?.id) {
        this._bookManager.select(undefined)
      }
    })

    this.on('Book', async ({ book }) => await this.openBook(book))
  }

  private async openBook(book: Book) {
    const documentSrc = await getFromCache(book.src)

    this.viewer.openDocument(documentSrc, book.name, book)

    if (documentSrc === book.src) {
      this.on('DocumentInit', async ({ pdfDocument }) => {
        const blob = new Blob([await pdfDocument.getData()])
        await saveInCache(book.src, new Response(blob))
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
