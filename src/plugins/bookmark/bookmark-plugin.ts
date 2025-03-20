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
    this.on('DocumentInit', () => this._bookmarkManager = new BookmarkManager(this.eventBus, this.translator))
    this.on('DocumentDestroy', () => this.destroyBookmarkManager())
    this.on('StorageLoaded', () => this.dispatch('BookmarkLoad'))
    this.on('BookmarkClick', ({ bookmark }) => this.setCurrentPage(bookmark.page))

    this.on('BookmarkLoad', ({ bookmarks }) => {
      this._bookmarkManager?.merge(this.storage?.get('bookmarks') ?? [])
      this._bookmarkManager?.merge(bookmarks ?? [])
    })

    this.on(['Bookmarks', 'BookmarkUpdated'], () => this.storage?.set('bookmarks', this._bookmarkManager?.all))
    this.on(['BookmarkAdded', 'BookmarkDeleted'], () => this.dispatch('BookmarkUpdated'))
    this.on('BookmarkAdded', ({ bookmark }) => this.dispatch(`BookmarkAdded${bookmark.page}`, { bookmark }))
    this.on('BookmarkDeleted', ({ bookmark }) => this.dispatch(`BookmarkDeleted${bookmark.page}`, { bookmark }))
  }

  protected onLoad() {
    this.sidebarManager?.add(this.bookmarkSidebarItem)

    if (this.resolvedParams?.bookmarks) {
      this._bookmarkManager?.set(this.resolvedParams.bookmarks)
    }
  }

  protected destroyBookmarkManager() {
    this._bookmarkManager?.destroy()
    this._bookmarkManager = undefined
  }

  protected destroy() {
    this.destroyBookmarkManager()
    this.sidebarManager?.delete(this.bookmarkSidebarItem)
  }
}
