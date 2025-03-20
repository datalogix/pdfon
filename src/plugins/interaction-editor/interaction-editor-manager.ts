import { Dispatcher, type EventBus } from '@/bus'
import type { $Fetch } from '@/utils'
import type { InteractionId, Interaction, InteractionCreate } from '../interaction'

export class InteractionEditorManager extends Dispatcher {
  protected interactions: Interaction[] = []
  protected updates = new Map<InteractionId, { id: InteractionId, x: number, y: number }>()
  private updatesTimeout?: NodeJS.Timeout

  constructor(
    readonly eventBus: EventBus,
    private readonly fetch: $Fetch,
    autoFetch: boolean = true,
  ) {
    super()

    if (autoFetch) {
      this.load()
    }
  }

  load() {
    this.fetch<Interaction[]>('/interactions').then((interactions) => {
      if (Array.isArray(interactions)) {
        this.set(interactions)
      }
    })
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

    this.dispatch('InteractionsEditor', { interactions: this.interactions })
  }

  getByPage(page: number) {
    return this.interactions.filter(interaction => interaction.page == page)
  }

  async add(data: InteractionCreate) {
    const formData = new FormData()
    formData.set('page', data.page.toString())
    formData.set('x', data.x.toString())
    formData.set('y', data.y.toString())
    formData.set('type', data.type)
    formData.set('content', data.content)

    if (data.title) {
      formData.set('title', data.title)
    }

    const interaction = await this.fetch<Interaction>('/interactions', {
      method: 'post',
      body: formData,
    })

    this.interactions.push(interaction)

    this.dispatch('InteractionEditorAdded', { interaction })

    return interaction
  }

  update(id: InteractionId, x: number, y: number) {
    const interaction = this.interactions.find(interaction => interaction.id === id)

    if (!interaction) {
      return
    }

    interaction.x = x
    interaction.y = y

    this.dispatch(`InteractionEditorUpdated${interaction.id}`, { interaction })
    this.dispatch('InteractionEditorUpdated', { interaction })

    this.updates.set(id, { id, x, y })
    clearTimeout(this.updatesTimeout)

    this.updatesTimeout = setTimeout(() => {
      this.fetch('/interactions/update', { method: 'post', body: Array.from(this.updates.values()) })
        .then(() => this.updates.clear())
    }, 1000)
  }

  delete(interaction: Interaction) {
    const index = this.interactions.findIndex(({ id }) => id === interaction.id)

    if (index < 0) {
      return
    }

    this.dispatch(`InteractionEditorDeleted${interaction.id}`, { interaction })
    this.dispatch('InteractionEditorDeleted', { interaction })

    this.interactions.splice(index, 1)
    this.fetch(`/interactions/${interaction.id}`, { method: 'delete' })
  }

  destroy() {
    this.interactions = []
    this.updates.clear()
    clearTimeout(this.updatesTimeout)
    this.dispatch('InteractionEditorDestroy')
  }
}
