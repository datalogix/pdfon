import { Plugin } from '../plugin'
import { localStorageDriver } from './drivers'
import type { StorageDriver } from './storage-driver'
import { StorageInitializer } from './storage-initializer'
import { StorageService } from './storage-service'

export type StoragePluginParams = {
  fingerprint?: string
  prefix?: string
  drivers?: StorageDriver[]
}

export class StoragePlugin extends Plugin<StoragePluginParams> {
  protected initializers = [StorageInitializer]
  private _storage?: StorageService

  get storage() {
    return this._storage
  }

  protected init() {
    this.on('DocumentInit', async ({ pdfDocument, options }) => {
      if (this._storage) await this.destroy()

      this._storage = new StorageService({
        key: options?.storageId ?? (this.resolvedParams?.fingerprint) ?? pdfDocument.fingerprints[0] as string,
        drivers: this.resolvedParams?.drivers ?? [localStorageDriver(this.resolvedParams?.prefix)],
        onLoaded: deserialized => this.dispatch('StorageLoaded', { storage: this._storage, deserialized }),
        onUpdated: serialized => this.dispatch('StorageUpdated', { storage: this._storage, serialized }),
        onError: message => this.logger.error(message),
      })

      this.dispatch('StorageInit', { storage: this._storage })
    })

    this.on('DocumentDestroy', async () => await this.destroy())
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
        this._storage?.set(key, value)
      } else {
        this._storage?.set(value)
      }
    })
  }

  protected async destroy() {
    await this._storage?.save()
    this.dispatch('StorageDestroy', { storage: this._storage })
    this._storage = undefined
  }
}
