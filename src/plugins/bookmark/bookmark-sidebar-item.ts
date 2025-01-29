import { createElement } from '@/utils'
import { SidebarItem } from '../sidebar'
import type { Bookmark } from './bookmark'
import type { BookmarkPlugin } from './bookmark-plugin'

export class BookmarkSidebarItem extends SidebarItem {
  get bookmarkManager() {
    return this.viewer.getLayerProperty<BookmarkPlugin>('BookmarkPlugin')?.bookmarkManager
  }

  get order() {
    return 3
  }

  build() {
    const container = createElement('div', 'bookmark-sidebar')
    this.on(['bookmarks', 'bookmarkupdated'], () => this.renderList(container))
    this.renderList(container)
    return container
  }

  protected renderList(container: HTMLElement) {
    container.innerHTML = ''

    const ul = createElement('ul', 'bookmark-list')

    this.bookmarkManager?.all.forEach((bookmark) => {
      const li = createElement('li')
      li.appendChild(this.renderItem(bookmark))
      ul.appendChild(li)
    })

    container.append(ul)
  }

  protected renderItem(bookmark: Bookmark) {
    const deleteButton = createElement('button', 'bookmark-delete', { type: 'button' })
    deleteButton.addEventListener('click', () => this.bookmarkManager?.delete(bookmark.page))

    const content = createElement('button', 'bookmark-content', { type: 'button' })
    content.appendChild(createElement('span', 'bookmark-page', { innerText: this.l10n.get('bookmark.page', { page: bookmark.page }) }))
    content.appendChild(createElement('span', 'bookmark-title', { innerText: bookmark.message }))
    content.addEventListener('click', () => this.bookmarkManager?.select(bookmark.page))

    const container = createElement('div', 'bookmark')
    container.appendChild(content)
    container.appendChild(deleteButton)

    return container
  }
}
