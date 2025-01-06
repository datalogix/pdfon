import type { EventBus, ListenerCallback, ListenerOptions } from '@/bus'

export abstract class Dispatcher {
  abstract get eventBus(): EventBus

  get signal(): AbortSignal | undefined {
    return undefined
  }

  on(name: string | string[], listener: ListenerCallback, options?: ListenerOptions) {
    const names = Array.isArray(name) ? name : [name]
    for (const key of names) {
      this.eventBus.on(key, listener, {
        signal: this.signal,
        ...options,
      })
    }
  }

  off(name: string, listener?: ListenerCallback) {
    this.eventBus.off(name, listener)
  }

  dispatch(name: string, data = {}) {
    this.eventBus.dispatch(name, { source: this, ...data })
  }
}
