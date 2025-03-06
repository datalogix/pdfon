import { Initializer, type Location, type InitializerOptions } from '@/viewer'
import type { StoragePlugin } from './storage-plugin'

export class StorageInitializer extends Initializer {
  get order() {
    return 1
  }

  get storage() {
    return this.viewer.getLayerProperty<StoragePlugin>('StoragePlugin')?.storage
  }

  async prepare(options: InitializerOptions) {
    const data = await this.storage?.load()

    return {
      ...options,
      ...data,
    }
  }

  execute() {
    const isNotPresentationMode = () => !this.viewer.isInPresentationMode
    this.dispatch('StoreOnEvent', { eventName: 'PageChanging', key: 'page', parameter: 'pageNumber' })
    this.dispatch('StoreOnEvent', { eventName: 'RotationChanging', key: 'rotation', parameter: 'rotation', validate: isNotPresentationMode })
    this.dispatch('StoreOnEvent', { eventName: 'ScaleChanging', key: 'scale', parameter: 'scale', validate: isNotPresentationMode })
    this.dispatch('StoreOnEvent', { eventName: 'ScrollModeChanged', key: 'scroll', parameter: 'mode', validate: isNotPresentationMode })
    this.dispatch('StoreOnEvent', { eventName: 'SpreadModeChanged', key: 'spread', parameter: 'mode', validate: isNotPresentationMode })
    this.dispatch('StoreOnEvent', {
      eventName: 'UpdateViewArea',
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
