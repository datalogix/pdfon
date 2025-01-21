import { Dispatcher, type EventBus } from '@/bus'
import type { Resource } from './resource'

export class ResourceManager extends Dispatcher {
  protected resources: Resource[] = []

  constructor(readonly eventBus: EventBus) {
    super()
  }

  get length() {
    return this.resources.length
  }

  get all() {
    return this.resources
  }

  set(resources: Resource[]) {
    this.resources = resources
    this.dispatch('resources', { resources })
  }

  destroy() {
    this.resources = []
  }
}
