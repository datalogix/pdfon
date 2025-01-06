import { Dispatcher, EventBus } from '@/bus'
import type { IL10n } from '@/l10n'
import type { Bookmark } from './bookmark'

export class BookmarkService extends Dispatcher {
  protected bookmarks = new Map<number, Bookmark>()

  constructor(
    readonly eventBus: EventBus,
    readonly l10n: IL10n,
  ) {
    super()
  }

  get length() {
    return this.bookmarks.size
  }

  load(bookmarks: Bookmark[] = []) {
    this.destroy()
    bookmarks.forEach(bookmark => this.bookmarks.set(bookmark.page, bookmark))
    this.dispatch('bookmarkloaded', { bookmarks: this.all() })
  }

  all() {
    return Array.from(this.bookmarks.values()).sort((a, b) => a.page - b.page)
  }

  has(page: number) {
    return this.bookmarks.has(page)
  }

  get(page: number) {
    return this.bookmarks.get(page)
  }

  add(bookmark: Bookmark) {
    this.bookmarks.set(bookmark.page, bookmark)
    this.dispatch('bookmarkadded', { bookmark })
  }

  addOrDelete(page: number) {
    const bookmark = this.get(page)
    const placeholder = this.l10n.get('bookmark.add-message', { page })
    const message = window.prompt(
      placeholder,
      bookmark?.message ?? placeholder,
    )

    if (message === null) {
      return
    }

    if (message) {
      this.add({ page, message })
    } else {
      this.delete(page)
    }
  }

  delete(page: number) {
    const bookmark = this.get(page)

    if (!bookmark) {
      return
    }

    if (!window.confirm(this.l10n.get('bookmark.delete-confirm'))) {
      return
    }

    this.bookmarks.delete(page)
    this.dispatch('bookmarkdeleted', { bookmark })
  }

  destroy() {
    this.bookmarks.clear()
  }
}
