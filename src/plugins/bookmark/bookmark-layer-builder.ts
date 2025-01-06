import { LayerBuilder } from '@/viewer'
import { createElement } from '@/utils'
import type { BookmarkPlugin } from './bookmark-plugin'

export class BookmarkLayerBuilder extends LayerBuilder {
  get bookmarkService() {
    return this.layerProperties.getLayerProperty<BookmarkPlugin>('BookmarkPlugin')?.bookmarkService
  }

  protected async build() {
    const div = this.create('bookmark-layer', -1)
    const button = div.appendChild(createElement('button', 'bookmark', { type: 'button' }))
    button.addEventListener('click', () => this.bookmarkService?.addOrDelete(this.id))

    if (this.bookmarkService?.has(this.id)) {
      button.classList.add('selected')
    }

    this.on('bookmarkloaded', () => {
      if (this.bookmarkService?.has(this.id)) {
        button.classList.add('selected')
      }
    })

    this.on(`bookmarkadded${this.id}`, () => button.classList.add('selected'))
    this.on(`bookmarkdeleted${this.id}`, () => button.classList.remove('selected'))
  }
}
