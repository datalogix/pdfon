import { ToolbarActionToggle } from '@/toolbar'
import { Modal, ProgressBar } from '@/tools'
import { createElement } from '@/utils'

export type InformationItem = {
  name: string
  value: string | number
  total?: number
  order?: number
}

export class Information extends ToolbarActionToggle {
  protected items = new Map<string, InformationItem>([])

  get enabled() {
    return this.items.size > 0
  }

  protected init() {
    this.on(['documentopen', 'documentdestroy'], () => {
      this.items.clear()
      this.toggle()
    })

    this.on('informationupdate', ({ informations }) => {
      this.items = informations
      this.toggle()
    })

    this.on('informationadd', ({ key, information }) => {
      this.items.set(key, {
        order: information.order ?? this.items.size,
        ...information,
      })
      this.toggle()
    })

    this.on('informationdelete', ({ key }) => {
      this.items.delete(key)
      this.toggle()
    })
  }

  open() {
    const content = createElement('ul', 'information')

    Array.from(this.items.values())
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .filter(item => typeof item.value !== 'undefined')
      .forEach((item) => {
        content.appendChild(this.item(item.name, item.value, item.total))
      })

    Modal.open(content, {
      title: this.l10n.get('information.title'),
      backdrop: 'overlay',
      onClose: () => this.execute(),
    }).classList.add('information-modal')
  }

  close() {
    Modal.close()
  }

  protected item(title: string, value: string | number, total?: number) {
    const header = createElement('header', 'header')
    header.appendChild(createElement('span', 'name', {
      innerHTML: title,
    }))
    header.appendChild(createElement('span', 'value', {
      innerHTML: typeof total === 'number' ? `${value} de ${total}` : value,
    }))

    const div = createElement('div', 'item')
    div.appendChild(header)

    if (typeof total === 'number' && typeof value === 'number') {
      const progressBar = new ProgressBar(total, value)
      div.appendChild(progressBar.render())
    }

    return div
  }
}
