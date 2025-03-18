import { $fetch } from 'ofetch'
import type { InteractionId, Interaction, InteractionCreate } from '../interaction'

export class InteractionEditorManager {
  protected interactions: Interaction[] = []
  protected updates = new Map<InteractionId, { x: number, y: number }>()
  private updatesTimeout?: NodeJS.Timeout

  set(interactions: Interaction[]) {
    this.interactions = interactions
  }

  getByPage(page: number) {
    return this.interactions.filter(interaction => interaction.page === page)
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

    const interaction = await $fetch<Interaction>('interactions', {
      method: 'post',
      body: formData,
    })

    this.interactions.push(interaction)

    return interaction
  }

  update(interaction: Interaction, x: number, y: number) {
    const item = this.interactions.find(({ id }) => id === interaction.id)

    if (!item) {
      return
    }

    item.x = x
    item.y = y

    this.updates.set(interaction.id, { x, y })

    clearTimeout(this.updatesTimeout)

    this.updatesTimeout = setTimeout(() => {
      $fetch('interactions/updates', { method: 'post', body: JSON.stringify(this.updates.entries()) })
        .then(() => this.updates.clear())
    }, 500)
  }

  remove(interaction: Interaction) {
    const index = this.interactions.findIndex(({ id }) => id === interaction.id)

    if (index < 0) {
      return
    }

    this.interactions.splice(index, 1)

    $fetch(`interactions/${interaction.id}`, { method: 'delete' })
  }

  destroy() {
    this.interactions = []
    this.updates.clear()
    clearTimeout(this.updatesTimeout)
  }
}
