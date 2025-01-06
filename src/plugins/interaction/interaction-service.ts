import { createElement } from '@/utils'
import { Modal } from '@/tools'
import { Interaction } from './interaction'

export class InteractionService {
  protected interactions: Interaction[] = []

  get length() {
    return this.interactions.length
  }

  get uncompleted() {
    return this.interactions.filter(interaction => !interaction.completed)
  }

  get completed() {
    return this.interactions.filter(interaction => !!interaction.completed)
  }

  load(interactions: Interaction[] = []) {
    this.destroy()

    this.interactions = interactions.sort((a, b) => {
      if (a.page !== b.page) {
        return a.page - b.page
      } else if (a.y === b.y) {
        return b.y - a.y
      } else {
        return b.x - a.x
      }
    })
  }

  get interactionsPerPage() {
    const interactionsPerPage = new Map<number, Interaction[]>()

    this.interactions.forEach((interaction) => {
      const perPage = interactionsPerPage.get(interaction.page) ?? []
      perPage.push(interaction)
      interactionsPerPage.set(interaction.page, perPage)
    })

    return interactionsPerPage
  }

  all() {
    return this.interactions
  }

  allGroup() {
    return this.interactionsPerPage
  }

  has(page: number) {
    return this.interactionsPerPage.has(page)
  }

  get(page: number) {
    return this.interactionsPerPage.get(page)
  }

  destroy() {
    this.interactions = []
  }

  open({ content }: Interaction) {
    const html = (() => {
      if (content.endsWith('.mp4') || content.endsWith('.mp3')) {
        return createElement(content.endsWith('.mp4') ? 'video' : 'audio', {
          controlsList: 'nodownload',
          src: content,
          controls: true,
          autoplay: true,
          preload: true,
        })
      }

      if (content.endsWith('.jpg') || content.endsWith('.jpeg') || content.endsWith('.png') || content.endsWith('.gif')) {
        return createElement('img', { src: content })
      }

      try {
        new URL(content)

        return createElement('iframe', {
          src: content,
          width: '100%',
          height: '100%',
          frameborder: 0,
          allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
          allowfullscreen: 'true',
        })
      } catch {
        //
      }

      return createElement('div', { innerHTML: content })
    })()

    const isIframe = html instanceof HTMLIFrameElement

    Modal.open(html, {
      draggable: !isIframe,
      backdrop: isIframe ? 'blur' : false,
    }).classList.add('interaction-modal')
  }
}
