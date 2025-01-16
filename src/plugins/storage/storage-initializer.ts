import { Initializer, type Location, type InitializerOptions } from '@/viewer'
import { StoragePlugin } from './storage-plugin'

export class StorageInitializer extends Initializer {
  get storage() {
    return this.viewer.getLayerProperty<StoragePlugin>('StoragePlugin')?.storage
  }

  prepare(options: InitializerOptions) {
    const data = Object.fromEntries(Object.entries(this.storage?.all() || {}).filter(([_, v]) => v !== undefined))

    return {
      ...options,
      ...data,
    }
  }

  finish() {
    const isInPresentationMode = () => this.viewer.isInPresentationMode
    this.dispatch('storeonevent', { eventName: 'pagechanging', key: 'page', parameter: 'pageNumber' })
    this.dispatch('storeonevent', { eventName: 'rotationchanging', key: 'rotation', parameter: 'rotation', validate: isInPresentationMode })
    this.dispatch('storeonevent', { eventName: 'scalechanging', key: 'scale', parameter: 'scale', validate: isInPresentationMode })
    this.dispatch('storeonevent', { eventName: 'scrollmodechanged', key: 'scroll', parameter: 'mode', validate: isInPresentationMode })
    this.dispatch('storeonevent', { eventName: 'spreadmodechanged', key: 'spread', parameter: 'mode', validate: isInPresentationMode })
    this.dispatch('storeonevent', {
      eventName: 'updateviewarea',
      parameter: ({ location }: { location: Location }) => ({
        page: location.pageNumber,
        scale: location.scale,
        scrollLeft: location.left,
        scrollTop: location.top,
        rotation: location.rotation,
      }),
    })
  }
}
