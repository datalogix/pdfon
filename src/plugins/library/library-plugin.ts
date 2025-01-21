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

    this.on('documenttitleupdated', () => {
      document.title = this._bookManager?.current?.name ?? document.title
    })

    this.on('book', ({ book }) => {
      if (!book) {
        this.informationManager?.set([])
        return
      }

      this.on('documentinitialized', () => {
        this.dispatch('interactionload', { interactions: book.interactions })
        this.dispatch('resourceload', { resources: book.resources })
      }, { once: true })

      this.viewer.openDocument(book.src)

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

  protected onLoad() {
    if (!this.params?.books) {
      return
    }

    this.bookManager?.set(this.params.books)

    if (!this.params?.bookId) {
      return
    }

    this._bookManager?.select(this.params?.bookId)
  }

  protected destroy() {
    this._bookManager?.destroy()
    this._bookManager = undefined
  }
}
