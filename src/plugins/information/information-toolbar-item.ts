import { ToolbarActionToggle } from '@/toolbar'
import { Modal, ProgressBar } from '@/tools'
import { createElement } from '@/utils'
import type { InformationPlugin } from './information-plugin'
import type { Information } from './information'

export class InformationToolbarItem extends ToolbarActionToggle {
  get informationPlugin() {
    return this.viewer.getLayerProperty<InformationPlugin>('InformationPlugin')!
  }

  get informationManager() {
    return this.informationPlugin.informationManager
  }

  get enabled() {
    return (this.informationManager?.length ?? 0) > 0
  }

  protected init() {
    this.on(['Informations', 'InformationAdded', 'InformationDeleted', 'InformationDestroy'], () => this.toggle())
  }

  open() {
    const content = createElement('ul', 'information')

    this.informationManager?.all
      .forEach(information => content.appendChild(this.item(information)))

    Modal.open(content, {
      title: this.informationPlugin.translate('title'),
      backdrop: 'overlay',
      onClose: () => this.execute(),
    }).classList.add('information-modal')
  }

  close() {
    Modal.close()
  }

  protected item({ name, value, total }: Information) {
    const header = createElement('header', 'header')
    header.appendChild(createElement('span', 'name', { innerHTML: name }))
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
