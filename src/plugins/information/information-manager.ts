import { Dispatcher, type EventBus } from '@/bus'
import type { Information } from './information'

export class InformationManager extends Dispatcher {
  protected informations = new Map<string, Information>([])

  constructor(readonly eventBus: EventBus) {
    super()
  }

  get length() {
    return this.all.length
  }

  get all() {
    return Array.from(this.informations.values())
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .filter(item => typeof item.value !== 'undefined')
  }

  set(informations: Information[]) {
    this.informations.clear()

    informations.forEach(information => this.informations.set(information.name, {
      order: information.order ?? this.informations.size,
      ...information,
    }))

    this.dispatch('informations', { informations })
  }

  add(information: Information) {
    this.informations.set(information.name, {
      order: information.order ?? this.informations.size,
      ...information,
    })

    this.dispatch('informationadded', { information })
  }

  delete(information: Information) {
    if (!this.informations.has(information.name)) return

    this.informations.delete(information.name)
    this.dispatch('informationdeleted', { information })
  }

  destroy() {
    this.set([])
  }
}
