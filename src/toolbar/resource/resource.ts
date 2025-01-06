import { ToolbarActionToggle } from '@/toolbar'
import { Modal } from '@/tools'
import { createElement } from '@/utils'

export type ResourceItem = {
  name: string
  src?: string
  items?: ResourceItem[]
}

export class Resource extends ToolbarActionToggle {
  protected resources: ResourceItem[] = []

  get enabled() {
    return this.resources.length > 0
  }

  protected init() {
    this.on('book', ({ book }) => {
      this.on('documentload', () => {
        this.dispatch('resourceload', { resources: book?.resources })
      })
    })

    this.on('documentdestroy', () => {
      this.resources = []
      this.toggle()
    })

    this.on('resourceload', ({ resources }) => {
      this.resources = resources ?? []
      this.toggle()
    })
  }

  open() {
    Modal.open(this.item(this.resources), {
      title: this.l10n.get('resource.title'),
      backdrop: 'overlay',
      onClose: () => this.execute(),
    }).classList.add('resource-modal')
  }

  close() {
    Modal.close()
  }

  protected item(items: ResourceItem[]) {
    const ul = createElement('ul')
    items.forEach((item) => {
      if (item.src) {
        const li = ul.appendChild(createElement('li'))
        li.appendChild(createElement('a', this.parseExtension(item.src), {
          innerText: item.name,
          href: item.src,
          target: '_blank',
        }))
      } else if (item.items) {
        const li = ul.appendChild(createElement('li'))
        li.appendChild(createElement('span', {
          innerText: item.name,
        }))
        li.appendChild(this.item(item.items))
      }
    })
    return ul
  }

  protected parseExtension(path: string) {
    if (path.endsWith('.txt')) {
      return 'txt'
    }

    if (path.endsWith('.pdf')) {
      return 'pdf'
    }

    if (path.endsWith('.doc') || path.endsWith('.docx')) {
      return 'doc'
    }

    if (path.endsWith('.xls') || path.endsWith('.xlsx')) {
      return 'xls'
    }

    if (path.endsWith('.ppt') || path.endsWith('.pptx')) {
      return 'ppt'
    }

    if (path.endsWith('.zip') || path.endsWith('.rar')) {
      return 'zip'
    }
  }
}
