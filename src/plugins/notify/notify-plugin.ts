import { Modal } from '@/tools'
import { createElement } from '@/utils'
import { Plugin } from '../plugin'

export class NotifyPlugin extends Plugin {
  protected init() {
    this.on('documentopen', () => Modal.close())
    this.on('documenterror', ({ message, reason }) => this.notify('error', undefined, message, reason))
    this.on('notify', ({ type, key, message, info }) => this.notify(type, key, message, info))
  }

  notify(type: 'info' | 'warn' | 'error' = 'info', key?: string, message?: string, info?: any) {
    const content = key ? this.l10n.get(key) : message ?? ''

    Modal.open(
      createElement('div', { innerHTML: content }),
      { title: this.l10n.get(`notify.${type}`) },
    ).classList.add(`modal-${type}`)

    this.logger.log(type, content, info, true)
  }

  protected destroy() {
    Modal.close()
  }
}
