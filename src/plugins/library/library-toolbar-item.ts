import { ToolbarActionToggle } from '@/toolbar'
import { Modal } from '@/tools'
import { createElement } from '@/utils'
import { LibraryPlugin } from './library-plugin'
import type { Book } from './book'

export class LibraryToolbarItem extends ToolbarActionToggle {
  protected persist = false

  get bookManager() {
    return this.viewer.getLayerProperty<LibraryPlugin>('LibraryPlugin')?.bookManager
  }

  init() {
    this.on('documentinitialized', () => {
      if (!this.bookManager?.available.length) {
        this.terminate()
      }
    })

    this.on('documentempty', () => this.openPersist())
  }

  openPersist() {
    this.persist = true
    this.execute()
    this.persist = false
  }

  open() {
    const content = createElement('div', 'books')
    this.bookManager?.available.forEach(book => content.appendChild(this.item(book)))

    Modal.open(content, {
      title: this.l10n.get('library.title'),
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

    if (book.sku) ul.append(createElement('li', { innerHTML: `${this.l10n.get('library.book.sku')}: <b>${book.sku}</b>` }))
    if (book.isbn) ul.append(createElement('li', { innerHTML: `${this.l10n.get('library.book.isbn')}: <b>${book.isbn}</b>` }))
    if (book.interactions) ul.append(createElement('li', { innerHTML: `${this.l10n.get('library.book.interactions')}: <b>${book.interactions.length}</b>` }))
    if (book.author) ul.append(createElement('li', { innerHTML: `${this.l10n.get('library.book.author')}: <b>${book.author}</b>` }))
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
