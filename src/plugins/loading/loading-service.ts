import type { IL10n } from '@/l10n'
import { createElement } from '@/utils'

export class LoadingService {
  protected container = createElement('div', 'loading')
  protected content = this.container.appendChild(createElement('div', 'loading-content'))

  constructor(
    readonly rootContainer: HTMLElement,
    readonly l10n: IL10n,
  ) {
    rootContainer.appendChild(this.container)
    this.init()
  }

  init() {
    this.container.hidden = false
    this.container.classList.remove('hidden')
    this.content.innerHTML = this.l10n.get('loading.init')
  }

  complete() {
    this.container.hidden = true
    this.container.classList.add('hidden')
  }

  update(loaded: number, total: number) {
    if (isNaN(loaded) || isNaN(total)) {
      return
    }

    const percentage = new Intl.NumberFormat('pt-BR', { style: 'percent' }).format(loaded > 0 ? loaded / total : 0)
    this.content.innerHTML = this.l10n.get('loading.update', { percentage })
  }

  finish() {
    this.content.innerHTML = this.l10n.get('loading.finish')
  }

  destroy() {
    this.container.remove()
  }
}
