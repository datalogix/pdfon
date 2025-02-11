import { Modal } from '@/tools'
import { createElement } from '@/utils'
import { Plugin } from '../plugin'

export class NotifyPlugin extends Plugin {
  protected init() {
    this.on('DocumentOpen', () => Modal.close())
    this.on('DocumentError', ({ message, reason }) => this.notify('error', undefined, message, reason))
    this.on('Notify', ({ type, key, message, info }) => this.notify(type, key, message, info))
  }

  notify(type: 'info' | 'warn' | 'error' = 'info', key?: string, message?: string, info?: any) {
    const content = key ? this.l10n.get(key) : message ?? ''

    Modal.open(
      createElement('div', { innerHTML: content }),
      { title: this.translate(type) },
    ).classList.add(`modal-${type}`)

    this.logger.log(type, content, info, true)
  }

  protected destroy() {
    Modal.close()
  }
}
