import { Plugin } from '../plugin'
import { StorageInitializer } from './storage-initializer'
import { StorageService } from './storage-service'

export type StoragePluginParams = {
  fingerprint?: string
  prefix?: string
}

export class StoragePlugin extends Plugin<StoragePluginParams> {
  protected initializers = [StorageInitializer]
  private _storage?: StorageService

  get storage() {
    return this._storage
  }

  protected init() {
    this.on('DocumentInit', ({ pdfDocument, options }) => {
      this._storage = new StorageService(
        options?.storageId ?? (this.resolvedParams?.fingerprint) ?? pdfDocument.fingerprints[0] as string,
        options?.storagePrefix ?? (this.resolvedParams?.prefix),
      )

      this.dispatch('StorageInit', { storage: this._storage })
    })

    this.on('DocumentDestroy', () => this.destroy())
    this.on('StoreOnEvent', options => this.storeOnEvent(options))
  }

  storeOnEvent({ eventName, key, parameter, validate }: { eventName: string, key?: string, parameter: string | ((eventData: any) => any), validate?: () => boolean }) {
    this.on(eventName, (eventData) => {
      if (validate && !validate()) return

      let value

      if (typeof parameter === 'function') {
        value = parameter(eventData)
      } else {
        value = eventData[parameter]
      }

      if (key) {
        this.storage?.set(key, value)
      } else {
        this.storage?.set(value)
      }
    })
  }

  protected destroy() {
    const storage = this.storage
    this._storage = undefined

    this.dispatch('StorageDestroy', { storage })
  }
}
