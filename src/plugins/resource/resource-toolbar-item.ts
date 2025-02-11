import type { ResourcePlugin } from '@/plugins'
import { ToolbarActionToggle } from '@/toolbar'
import { Modal } from '@/tools'
import { createElement } from '@/utils'
import type { Resource } from './resource'

export class ResourceToolbarItem extends ToolbarActionToggle {
  get resourceManager() {
    return this.viewer.getLayerProperty<ResourcePlugin>('ResourcePlugin')?.resourceManager
  }

  get enabled() {
    return (this.resourceManager?.length ?? 0) > 0
  }

  protected init() {
    this.on(['Resources', 'ResourceDestroy'], () => this.toggle())
  }

  open() {
    Modal.open(this.item(this.resourceManager?.all ?? []), {
      title: this.translate('title'),
      backdrop: 'overlay',
      onClose: () => this.execute(),
    }).classList.add('resource-modal')
  }

  close() {
    Modal.close()
  }

  protected item(items: Resource[]) {
    const ul = createElement('ul')
    items?.forEach((item) => {
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

    if (path.endsWith('.gif') || path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      return 'image'
    }

    if (path.endsWith('.mp3')) {
      return 'audio'
    }

    if (path.endsWith('.mp4')) {
      return 'video'
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
