import { ToolbarActionToggle } from '@/toolbar'
import { Modal } from '@/tools'
import { createElement } from '@/utils'
import type { Book } from './book'
import type { LibraryPlugin } from './library-plugin'

export class LibraryToolbarItem extends ToolbarActionToggle {
  protected persist = false

  get libraryPlugin() {
    return this.viewer.getLayerProperty<LibraryPlugin>('LibraryPlugin')!
  }

  get bookManager() {
    return this.libraryPlugin.bookManager
  }

  get enabled() {
    return (this.bookManager?.available.length ?? 0) > 0
  }

  init() {
    this.on('Books', () => {
      this.toggle()
      this.markAsActivated()
    })

    this.on('DocumentEmpty', () => {
      this.on('Books', () => {
        this.openPersist()
      })

      this.openPersist()
    })
  }

  openPersist() {
    if (this.opened || !this.enabled) return

    this.persist = true
    this.execute()
    this.persist = false
  }

  open() {
    const content = createElement('div', 'books')
    this.bookManager?.available.forEach(book => content.appendChild(this.item(book)))

    Modal.open(content, {
      title: this.libraryPlugin.translate('title'),
      backdrop: 'overlay',
      persist: this.persist,
      onClose: () => this.execute(),
    }).classList.add('library-modal')
  }

  close() {
    Modal.close()
  }

  protected item(book: Book) {
    const button = createElement('button', 'book', { type: 'button' })
    const info = createElement('div', 'info')
    const ul = createElement('ul')

    if (book.sku) ul.append(createElement('li', { innerHTML: `${this.libraryPlugin.translate('book.sku')}: <b>${book.sku}</b>` }))
    if (book.isbn) ul.append(createElement('li', { innerHTML: `${this.libraryPlugin.translate('book.isbn')}: <b>${book.isbn}</b>` }))
    if (book.interactions) ul.append(createElement('li', { innerHTML: `${this.libraryPlugin.translate('book.interactions')}: <b>${book.interactions.length}</b>` }))
    if (book.author) ul.append(createElement('li', { innerHTML: `${this.libraryPlugin.translate('book.author')}: <b>${book.author}</b>` }))
    if (book.description) ul.append(createElement('li', 'description', { innerHTML: book.description }))

    info.appendChild(createElement('h2', { innerText: book.name }))
    info.appendChild(ul)

    button.appendChild(book.cover ? createElement('img', { src: book.cover }) : createElement('i'))
    button.appendChild(info)
    button.addEventListener('click', () => {
      this.close()
      this.bookManager?.select(book)
    })

    return button
  }
}
