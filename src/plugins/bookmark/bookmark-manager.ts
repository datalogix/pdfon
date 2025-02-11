import { Dispatcher, EventBus } from '@/bus'
import type { Translator } from '@/l10n'
import type { Bookmark } from './bookmark'

export class BookmarkManager extends Dispatcher {
  protected bookmarks = new Map<number, Bookmark>()

  constructor(
    readonly eventBus: EventBus,
    readonly translator: Translator,
  ) {
    super()
  }

  get length() {
    return this.bookmarks.size
  }

  get all() {
    return Array.from(this.bookmarks.values()).sort((a, b) => a.page - b.page)
  }

  set(bookmarks: Bookmark[]) {
    this.bookmarks.clear()
    bookmarks.forEach(bookmark => this.bookmarks.set(bookmark.page, bookmark))
    this.dispatch('Bookmarks', { bookmarks: this.all })
  }

  merge(bookmarks: Bookmark[]) {
    bookmarks.forEach((bookmark) => {
      this.bookmarks.set(bookmark.page, bookmark)
    })
  }

  has(page: number) {
    return this.bookmarks.has(page)
  }

  get(page: number) {
    return this.bookmarks.get(page)
  }

  select(page: number) {
    const bookmark = this.get(page)

    if (bookmark) {
      this.dispatch('BookmarkClick', { bookmark })
    }
  }

  add(bookmark: Bookmark) {
    this.bookmarks.set(bookmark.page, bookmark)
    this.dispatch('BookmarkAdded', { bookmark })
  }

  toggle(page: number) {
    const bookmark = this.get(page)
    const placeholder = this.translator.translate('add-message', { page })
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

    if (!window.confirm(this.translator.translate('delete-confirm'))) {
      return
    }

    this.bookmarks.delete(page)
    this.dispatch('BookmarkDeleted', { bookmark })
  }

  destroy() {
    this.bookmarks.clear()
  }
}
