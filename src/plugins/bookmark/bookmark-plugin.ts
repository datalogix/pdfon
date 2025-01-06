import { Plugin } from '../plugin'
import type { StoragePlugin } from '../storage'
import { BookmarkLayerBuilder } from './bookmark-layer-builder'
import { BookmarkService } from './bookmark-service'

export class BookmarkPlugin extends Plugin {
  private _bookmarkService?: BookmarkService

  get bookmarkService() {
    return this._bookmarkService
  }

  get storage() {
    return this.viewer.getLayerProperty<StoragePlugin>('StoragePlugin')?.storage
  }

  protected init() {
    this.viewer.addLayerBuilder(BookmarkLayerBuilder)
    this._bookmarkService = new BookmarkService(this.eventBus, this.l10n)

    this.on('storageinitialized', () => this.dispatch('bookmarkload', { bookmarks: this.storage?.get('bookmarks') }))
    this.on('pagesdestroy', () => this._bookmarkService?.destroy())
    this.on('bookmarkload', ({ bookmarks }) => this._bookmarkService?.load(bookmarks))

    this.on(['bookmarkadded', 'bookmarkdeleted'], () => this.dispatch('bookmarkupdated', { bookmarks: this._bookmarkService?.all() }))
    this.on('bookmarkadded', ({ bookmark }) => this.dispatch(`bookmarkadded${bookmark.page}`, { bookmark }))
    this.on('bookmarkdeleted', ({ bookmark }) => this.dispatch(`bookmarkdeleted${bookmark.page}`, { bookmark }))
    this.on('bookmarkupdated', ({ bookmarks }) => this.storage?.set('bookmarks', bookmarks))

    this.on('bookmarkadd', ({ page }) => this._bookmarkService?.addOrDelete(page))
    this.on('bookmarkdelete', ({ bookmark }) => this._bookmarkService?.delete(bookmark.page))
    this.on('bookmarkselect', ({ bookmark }) => this.setCurrentPage(bookmark.page))
  }

  protected destroy() {
    this.viewer.removeLayerBuilder(BookmarkLayerBuilder)
    this._bookmarkService?.destroy()
    this._bookmarkService = undefined
  }
}
