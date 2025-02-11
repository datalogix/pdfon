import type { Translator } from '@/l10n'
import { createElement } from '@/utils'

export class LoadingService {
  protected container = createElement('div', 'loading')
  protected content = this.container.appendChild(createElement('div', 'loading-content'))

  constructor(readonly translator: Translator) {
    this.init()
  }

  init() {
    this.container.hidden = false
    this.container.classList.remove('hidden')
    this.content.innerHTML = this.translator.translate('init')
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
    this.content.innerHTML = this.translator.translate('update', { percentage })
  }

  finish() {
    this.content.innerHTML = this.translator.translate('finish')
  }

  destroy() {
    this.container.remove()
  }

  render(rootContainer: HTMLElement) {
    rootContainer.appendChild(this.container)
  }
}
