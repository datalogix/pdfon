import { LayerBuilder } from '@/viewer'
import { createElement } from '@/utils'
import type { BookmarkPlugin } from './bookmark-plugin'

export class BookmarkLayerBuilder extends LayerBuilder {
  get bookmarkManager() {
    return this.layerProperties.getLayerProperty<BookmarkPlugin>('BookmarkPlugin')?.bookmarkManager
  }

  protected build() {
    const div = this.create('bookmark-layer', -1)
    const button = div.appendChild(createElement('button', 'bookmark', { type: 'button' }))
    button.addEventListener('click', () => this.bookmarkManager?.toggle(this.id))

    if (this.bookmarkManager?.has(this.id)) {
      button.classList.add('selected')
    }

    this.on('bookmarks', () => {
      if (this.bookmarkManager?.has(this.id)) {
        button.classList.add('selected')
      }
    })

    this.on(`bookmarkadded${this.id}`, () => button.classList.add('selected'))
    this.on(`bookmarkdeleted${this.id}`, () => button.classList.remove('selected'))
  }
}
