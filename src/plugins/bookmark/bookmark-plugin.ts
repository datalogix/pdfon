import { Plugin } from '../plugin'
import type { SidebarPlugin } from '../sidebar'
import type { StoragePlugin } from '../storage'
import type { Bookmark } from './bookmark'
import { BookmarkLayerBuilder } from './bookmark-layer-builder'
import { BookmarkManager } from './bookmark-manager'
import { BookmarkSidebarItem } from './bookmark-sidebar-item'

export type BookmarkPluginParams = {
  bookmarks?: Bookmark[]
}

export class BookmarkPlugin extends Plugin<BookmarkPluginParams> {
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

    this.on('documentdestroy', () => this._bookmarkManager?.destroy())
    this.on('storageinitialized', () => this.dispatch('bookmarkload'))
    this.on('bookmarkclick', ({ bookmark }) => this.setCurrentPage(bookmark.page))

    this.on('bookmarkload', ({ bookmarks }) => {
      this._bookmarkManager?.merge(this.storage?.get('bookmarks') ?? [])
      this._bookmarkManager?.merge(bookmarks ?? [])
    })

    this.on(['bookmarks', 'bookmarkupdated'], () => this.storage?.set('bookmarks', this._bookmarkManager?.all))
    this.on(['bookmarkadded', 'bookmarkdeleted'], () => this.dispatch('bookmarkupdated'))
    this.on('bookmarkadded', ({ bookmark }) => this.dispatch(`bookmarkadded${bookmark.page}`, { bookmark }))
    this.on('bookmarkdeleted', ({ bookmark }) => this.dispatch(`bookmarkdeleted${bookmark.page}`, { bookmark }))
  }

  protected onLoad(params?: BookmarkPluginParams) {
    this.sidebarManager?.add(this.bookmarkSidebarItem)

    if (params?.bookmarks) {
      this._bookmarkManager?.set(params?.bookmarks)
    }
  }

  protected destroy() {
    this.sidebarManager?.delete(this.bookmarkSidebarItem)
    this._bookmarkManager?.destroy()
    this._bookmarkManager = undefined
  }
}
