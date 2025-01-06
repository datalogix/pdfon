import { SidebarItem } from '@/toolbar'
import { createElement } from '@/utils'
import type { Bookmark } from './bookmark'
import type { BookmarkPlugin } from './bookmark-plugin'

export class BookmarkSidebarItem extends SidebarItem {
  get bookmarkService() {
    return this.viewer.getLayerProperty<BookmarkPlugin>('BookmarkPlugin')?.bookmarkService
  }

  build() {
    const container = createElement('div', 'bookmark-sidebar')
    this.on(['bookmarkloaded', 'bookmarkupdated'], ({ bookmarks }) => this.renderList(container, bookmarks))
    this.renderList(container, this.bookmarkService?.all())
    return container
  }

  protected renderList(container: HTMLElement, bookmarks: Bookmark[] = []) {
    container.innerHTML = ''

    const ul = createElement('ul', 'bookmark-list')

    bookmarks.forEach((bookmark) => {
      const li = createElement('li')
      li.appendChild(this.renderItem(bookmark))
      ul.appendChild(li)
    })

    container.append(ul)
  }

  protected renderItem(bookmark: Bookmark) {
    const deleteButton = createElement('button', 'bookmark-delete', { type: 'button' })
    deleteButton.addEventListener('click', () => this.dispatch('bookmarkdelete', { bookmark }))

    const content = createElement('button', 'bookmark-content', { type: 'button' })
    content.appendChild(createElement('span', 'bookmark-page', { innerText: this.l10n.get('bookmark.page', { page: bookmark.page }) }))
    content.appendChild(createElement('span', 'bookmark-title', { innerText: bookmark.message }))
    content.addEventListener('click', () => this.dispatch('bookmarkselect', { bookmark }))

    const container = createElement('div', 'bookmark')
    container.appendChild(content)
    container.appendChild(deleteButton)

    return container
  }
}
