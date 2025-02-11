import { Dispatcher, EventBus } from '@/bus'
import { createElement } from '@/utils'
import { Modal } from '@/tools'
import { Interaction, InteractionId } from './interaction'

export class InteractionManager extends Dispatcher {
  protected interactions: Interaction[] = []
  protected groupedByPageCache?: Map<number, Interaction[]>

  constructor(readonly eventBus: EventBus) {
    super()
  }

  get length() {
    return this.interactions.length
  }

  get uncompleted() {
    return this.interactions.filter(interaction => !interaction.completed)
  }

  get completed() {
    return this.interactions.filter(interaction => !!interaction.completed)
  }

  get all() {
    return this.interactions
  }

  set(interactions: Interaction[]) {
    this.interactions = interactions.sort((a, b) => {
      if (a.page !== b.page) {
        return a.page - b.page
      } else if (a.x === b.x) {
        return b.y - a.y
      } else {
        return b.x - a.x
      }
    })

    this.resetGroupedByPageCache()
    this.dispatch('Interactions', { interactions: this.interactions })
  }

  getGroupedByPage() {
    if (!this.groupedByPageCache) {
      this.groupedByPageCache = new Map<number, Interaction[]>()

      this.interactions.forEach((interaction) => {
        const perPage = this.groupedByPageCache?.get(interaction.page) ?? []
        perPage.push(interaction)
        this.groupedByPageCache?.set(interaction.page, perPage)
      })
    }

    return this.groupedByPageCache
  }

  getByPage(page: number) {
    return this.getGroupedByPage().get(page)
  }

  find(interactionId: InteractionId) {
    return this.interactions.find(interaction => interaction.id.toString() === interactionId.toString())
  }

  select(interaction?: Interaction | InteractionId) {
    interaction = typeof interaction === 'number' || typeof interaction === 'string'
      ? this.find(interaction)
      : interaction

    if (!interaction) {
      return
    }

    this.markAsCompleted(interaction)
    this.openContent(interaction)
    this.dispatch('InteractionClick', { interaction })
  }

  markAsCompleted(interaction: Interaction) {
    interaction.completed = true
    this.resetGroupedByPageCache()

    this.dispatch(`InteractionUpdated${interaction.id}`, { interaction })
    this.dispatch('InteractionUpdated', { interaction })
  }

  private resetGroupedByPageCache() {
    this.groupedByPageCache = undefined
  }

  openContent({ content }: Interaction) {
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

  destroy() {
    this.resetGroupedByPageCache()
    this.interactions = []
    this.dispatch('InteractionDestroy')
  }
}
