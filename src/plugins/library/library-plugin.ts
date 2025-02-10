import { resolveValue } from '@/utils'
import { Plugin, type ToolbarItemType } from '../plugin'
import { BookManager } from './book-manager'
import type { Book, BookId } from './book'
import { LibraryToolbarItem } from './library-toolbar-item'
import type { InformationPlugin } from '../information'

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

    this.on('documentopen', ({ documentType }) => {
      if (this._bookManager && documentType !== this._bookManager.current?.src) {
        this._bookManager.select(undefined)
      }
    })

    this.on('book', ({ book, options }) => {
      this.informationManager?.set([])

      this.on('storagedestroy', () => {
        this.dispatch('interactionload', { interactions: [] })
        this.dispatch('resourceload', { resources: [] })
      }, { once: true })

      if (!book) {
        return
      }

      this.viewer.openDocument(book.src, book.name, options)

      this.on('documentinitialized', async () => {
        const interactions = await resolveValue(book.interactions, book)
        const resources = await resolveValue(book.resources, book)

        this.dispatch('interactionload', { interactions })
        this.dispatch('resourceload', { resources })
        this.dispatch('bookinitialized', { book })
      }, { once: true })

      const props = ['name', 'sku', 'author', 'description']

      props.forEach((key, index) => {
        this.informationManager?.add({
          name: this.l10n.get(`library.book.${key}`),
          value: book[key],
          order: index + 1,
        })
      })
    })
  }

  protected onLoad(params?: LibraryPluginParams) {
    if (params?.books) {
      this.bookManager?.set(params.books)
    }

    if (params?.bookId) {
      this.on('documentempty', () => this._bookManager?.select(params.bookId), { once: true })
    }
  }

  protected destroy() {
    this._bookManager?.destroy()
    this._bookManager = undefined
  }
}
