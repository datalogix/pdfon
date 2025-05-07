import type { InitializerOptions } from '@/viewer'
import { Plugin } from '../plugin'
import { indexedDBDriver } from './drivers'
import type { StorageDriver } from './storage-driver'
import { StorageInitializer } from './storage-initializer'
import { StorageService } from './storage-service'

export type StoragePluginParams = {
  fingerprint?: string
  prefix?: string
  drivers?: StorageDriver[] | ((options: InitializerOptions) => Promise<StorageDriver[]>)
}

export class StoragePlugin extends Plugin<StoragePluginParams> {
  protected initializers = [StorageInitializer]
  private _storage?: StorageService

  get storage() {
    return this._storage
  }

  protected init() {
    this.on('DocumentInit', async ({ options }) => {
      if (this._storage) await this.destroy()

      const drivers = typeof this.resolvedParams?.drivers === 'function'
        ? await this.resolvedParams?.drivers(options)
        : this.resolvedParams?.drivers

      this._storage = new StorageService({
        key: options?.storageId ?? options?.id ?? this.resolvedParams?.fingerprint ?? this.viewer.documentFingerprint,
        drivers: drivers ?? [indexedDBDriver(this.resolvedParams?.prefix)],
        onLoaded: deserialized => this.dispatch('StorageLoaded', { storage: this._storage, drivers, deserialized }),
        onUpdated: serialized => this.dispatch('StorageUpdated', { storage: this._storage, drivers, serialized }),
        onError: message => this.logger.error(message),
      })

      this.dispatch('StorageInit', { storage: this._storage, drivers })
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
    await this._storage?.save(true)
    this.dispatch('StorageDestroy', { storage: this._storage })
    this._storage = undefined
  }
}
