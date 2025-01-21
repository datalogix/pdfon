import { Plugin } from '../plugin'
import type { SidebarPlugin } from '../sidebar'
import type { StoragePlugin } from '../storage'
import { BookmarkLayerBuilder } from './bookmark-layer-builder'
import { BookmarkManager } from './bookmark-manager'
import { BookmarkSidebarItem } from './bookmark-sidebar-item'

export class BookmarkPlugin extends Plugin {
  protected layerBuilders = [BookmarkLayerBuilder]
  private _bookmarkManager?: BookmarkManager
  private bookmarkSidebarItem = new BookmarkSidebarItem()

  get bookmarkManager() {
    return this._bookmarkManager
  }

  get storage() {
    return this.viewer.getLayerProperty<StoragePlugin>('StoragePlugin')?.storage
  }

  get sidebarManager() {
    return this.viewer.getLayerProperty<SidebarPlugin>('SidebarPlugin')?.sidebarManager
  }

  protected init() {
    this._bookmarkManager = new BookmarkManager(this.eventBus, this.l10n)

    this.on('storageinitialized', () => this.dispatch('bookmarkload', { bookmarks: this.storage?.get('bookmarks') }))
    this.on('pagesdestroy', () => this._bookmarkManager?.destroy())
    this.on('bookmarkload', ({ bookmarks }) => this._bookmarkManager?.set(bookmarks ?? []))

    this.on(['bookmarkadded', 'bookmarkdeleted'], () => this.dispatch('bookmarkupdated', { bookmarks: this._bookmarkManager?.all }))
    this.on('bookmarkadded', ({ bookmark }) => this.dispatch(`bookmarkadded${bookmark.page}`, { bookmark }))
    this.on('bookmarkdeleted', ({ bookmark }) => this.dispatch(`bookmarkdeleted${bookmark.page}`, { bookmark }))
    this.on('bookmarkupdated', ({ bookmarks }) => this.storage?.set('bookmarks', bookmarks))

    this.on('bookmarkclick', ({ bookmark }) => this.setCurrentPage(bookmark.page))
  }

  protected onLoad() {
    this.sidebarManager?.add(this.bookmarkSidebarItem)
  }

  protected destroy() {
    this.sidebarManager?.delete(this.bookmarkSidebarItem)
    this._bookmarkManager?.destroy()
    this._bookmarkManager = undefined
  }
}
