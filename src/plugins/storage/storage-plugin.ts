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

  protected init(): Promise<void> | void {
    this.on('documentinit', ({ pdfDocument, options }) => {
      this._storage = new StorageService(
        options?.storageId ?? this.params?.fingerprint ?? pdfDocument.fingerprints[0] as string,
        options?.storagePrefix ?? this.params?.prefix,
      )

      this.dispatch('storageinitialized', { storage: this.storage })
    })

    this.on('documentdestroy', () => {
      this._storage = undefined
    })

    this.on('storeonevent', params => this.storeOnEvent(params))
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
}
