import type { Location } from '@/viewer'
import { Plugin } from '../plugin'
import { StorageInitializer } from './storage-initializer'

export class StoragePlugin extends Plugin {
  private storageInitializer = new StorageInitializer()

  get storage() {
    return this.storageInitializer.storageService
  }

  protected init(): Promise<void> | void {
    this.viewer.addInitializer(this.storageInitializer)

    this.on('rotationchanging', ({ rotation }) => {
      if (this.initialized && !this.viewer.isInPresentationMode) {
        this.storage?.set('rotation', rotation)
      }
    })

    this.on('scalechanging', ({ scale }) => {
      if (this.initialized && !this.viewer.isInPresentationMode) {
        this.storage?.set('scale', scale)
      }
    })

    this.on('scrollmodechanged', ({ mode: scroll }) => {
      if (this.initialized && !this.viewer.isInPresentationMode) {
        this.storage?.set('scroll', scroll)
      }
    })

    this.on('spreadmodechanged', ({ mode: spread }) => {
      if (this.initialized && !this.viewer.isInPresentationMode) {
        this.storage?.set('spread', spread)
      }
    })

    this.on('pagechanging', ({ pageNumber: page }) => {
      if (this.initialized) {
        this.storage?.set('page', page)
      }
    })

    this.on('updateviewarea', ({ location }: { location: Location }) => {
      if (this.initialized) {
        this.storage?.set({
          page: location.pageNumber,
          scale: location.scale,
          scrollLeft: location.left,
          scrollTop: location.top,
          rotation: location.rotation,
        })
      }
    })

    this.on('sidebarselected', ({ key: sidebar }) => {
      if (this.initialized) {
        this.storage?.set('sidebar', sidebar)
      }
    })

    this.on('sidebartoggle', ({ opened }) => {
      if (this.initialized) {
        this.storage?.set('sidebaropened', opened)
      }
    })
  }

  protected destroy(): Promise<void> | void {
    this.viewer.removeInitializer(this.storageInitializer)
  }
}
