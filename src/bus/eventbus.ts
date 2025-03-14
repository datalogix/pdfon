export class EventBus<
  ListenersT extends Record<string, any> = Record<string, ListenerCallback>,
  ListenerNameT extends ListenerKeys<ListenersT> = ListenerKeys<ListenersT>,
> {
  private listeners: Map<ListenerNameT, Listener[]> = new Map()

  _dispatch<NameT extends ListenerNameT>(
    name: NameT,
    ...data: Parameters<InferCallback<ListenersT, NameT>>
  ) {
    return this.dispatch(name, ...data)
  }

  _on<NameT extends ListenerNameT>(
    name: NameT,
    listener: InferCallback<ListenersT, NameT>,
    options: ListenerOptions = {},
  ) {
    return this.on(name, listener, options)
  }

  _off<NameT extends ListenerNameT>(
    name: NameT,
    listener?: InferCallback<ListenersT, NameT>,
  ) {
    return this.off(name, listener)
  }

  dispatch<NameT extends ListenerNameT>(
    name: NameT,
    ...data: Parameters<InferCallback<ListenersT, NameT>>
  ) {
    const key = name.toLowerCase() as ListenerNameT
    const eventListeners = this.listeners.get(key)
    if (!eventListeners) return

    const { internalListeners, externalListeners } = eventListeners.reduce<{
      internalListeners: ListenerCallback[]
      externalListeners: ListenerCallback[]
    }>(
      (acc, evt) => {
        if (evt.once) {
          this.off(name, evt.listener as InferCallback<ListenersT, NameT>)
        }

        acc[evt.external ? 'externalListeners' : 'internalListeners'].push(evt.listener)
        return acc
      },
      { internalListeners: [], externalListeners: [] },
    );

    [...internalListeners, ...externalListeners].forEach(listener => listener(...data))
  }

  on<NameT extends ListenerNameT>(
    name: NameT,
    listener: InferCallback<ListenersT, NameT>,
    options: ListenerOptions = {},
  ) {
    if (options.signal?.aborted) {
      console.error('Cannot use an `aborted` signal.')
      return
    }

    let rmAbort: ListenerAbort | undefined = undefined

    if (options.signal) {
      const onAbort = () => this.off(name, listener)
      rmAbort = () => options.signal?.removeEventListener('abort', onAbort)
      options.signal.addEventListener('abort', onAbort)
    }

    const key = name.toLowerCase() as ListenerNameT
    const eventListeners = this.listeners.get(key) || []
    eventListeners.push({
      listener,
      external: options.external ?? true,
      once: options.once === true,
      rmAbort,
    })

    this.listeners.set(key, eventListeners)
  }

  off<NameT extends ListenerNameT>(
    name: NameT,
    listener?: InferCallback<ListenersT, NameT>,
  ) {
    const key = name.toLowerCase() as ListenerNameT
    const eventListeners = this.listeners.get(key)
    if (!eventListeners) return

    this.listeners.set(key, eventListeners.filter((evt) => {
      if (evt.listener === listener) {
        evt.rmAbort?.()
        return false
      }

      return true
    }))
  }
}

export type ListenerCallback = (...data: any) => Promise<any> | any
export type ListenerOptions = {
  external?: boolean
  once?: boolean
  signal?: AbortSignal
}

export type ListenerAbort = () => void

export type Listener = Omit<ListenerOptions, 'signal'> & {
  listener: ListenerCallback
  rmAbort?: ListenerAbort
}

export type ListenerKeys<T> = keyof T & string

export type InferCallback<HT, HN extends keyof HT> = HT[HN] extends ListenerCallback
  ? HT[HN]
  : never

export type Listeners = {
  [eventName: string]: Listener[]
}
