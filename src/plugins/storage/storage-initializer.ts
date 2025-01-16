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
    this.on('rotationchanging', ({ rotation }) => {
      if (!this.viewer.isInPresentationMode) {
        this.storage?.set('rotation', rotation)
      }
    })

    this.on('scalechanging', ({ scale }) => {
      if (!this.viewer.isInPresentationMode) {
        this.storage?.set('scale', scale)
      }
    })

    this.on('scrollmodechanged', ({ mode: scroll }) => {
      if (!this.viewer.isInPresentationMode) {
        this.storage?.set('scroll', scroll)
      }
    })

    this.on('spreadmodechanged', ({ mode: spread }) => {
      if (!this.viewer.isInPresentationMode) {
        this.storage?.set('spread', spread)
      }
    })

    this.on('pagechanging', ({ pageNumber: page }) => {
      this.storage?.set('page', page)
    })

    this.on('updateviewarea', ({ location }: { location: Location }) => {
      this.storage?.set({
        page: location.pageNumber,
        scale: location.scale,
        scrollLeft: location.left,
        scrollTop: location.top,
        rotation: location.rotation,
      })
    })

    /*
    const isInPresentationMode = () => this.viewer.isInPresentationMode
    this.dispatch('storageupdate', { event: 'pagechanging', name: 'page', parameter: 'pageNumber' })
    this.dispatch('storageupdate', { event: 'rotationchanging', name: 'rotation', parameter: 'rotation', check: isInPresentationMode })
    this.dispatch('storageupdate', { event: 'scalechanging', name: 'scale', parameter: 'scale', check: isInPresentationMode })
    this.dispatch('storageupdate', { event: 'scrollmodechanged', name: 'scroll', parameter: 'mode', check: isInPresentationMode })
    this.dispatch('storageupdate', { event: 'spreadmodechanged', name: 'spread', parameter: 'mode', check: isInPresentationMode })
    this.dispatch('storageupdate', {
      event: 'updateviewarea',
      parameter: ({ location }: { location: Location }) => ({
        page: location.pageNumber,
        scale: location.scale,
        scrollLeft: location.left,
        scrollTop: location.top,
        rotation: location.rotation,
      }),
    })
    */
  }
}
