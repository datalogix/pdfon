import type { InitializerOptions } from '@/viewer'
import { deserialize, serialize } from '@/utils'
import type { StorageDriver } from './storage-driver'

export type StorageServiceOptions = {
  key: string
  drivers: StorageDriver[]
  onLoaded?: (deserialized: any) => void
  onUpdated?: (serialized: string, data: any) => void
  onError?: (e: any) => void
}

export class StorageService<Data extends Record<string, any> = InitializerOptions> {
  private key!: string
  private _loaded: boolean = false
  private data: Data = {} as Data

  constructor(readonly options: StorageServiceOptions) {
    this.setKey(options.key)
  }

  get loaded() {
    return this._loaded
  }

  getKey() {
    return this.key
  }

  setKey(key: string) {
    this.key = key
  }

  async load() {
    try {
      const values = await Promise.allSettled(this.options.drivers.map(driver => driver.load(this.key)))
      this.data = values.filter(value => value.status === 'fulfilled')
        .reduce((prev, { value }) => ({ ...prev, ...deserialize(value, {}) }), {} as Data)
    } catch (e) {
      this.options.onError?.(e)
    } finally {
      this._loaded = true
      this.options.onLoaded?.(this.data)
    }

    return this.data
  }

  async save(force?: boolean) {
    if (!this._loaded) return

    const serialized = serialize(this.data)

    try {
      await Promise.allSettled(this.options.drivers.map(driver => driver.save(this.key, serialized, this.data, force)))
    } catch (e) {
      this.options.onError?.(e)
    } finally {
      this.options.onUpdated?.(serialized, this.data)
    }
  }

  get<K extends keyof Data>(key: K, defaultValue?: Data[K]) {
    if (!this._loaded) {
      return defaultValue
    }

    return key in this.data ? this.data[key] : defaultValue
  }

  set<K extends keyof Data>(keyOrProperties: K | Partial<Data>, value?: Data[K]) {
    if (!this._loaded) return

    if (typeof keyOrProperties === 'string') {
      this.data[keyOrProperties as K] = value!
    } else {
      Object.assign(this.data, keyOrProperties)
    }

    this.save()
  }
}
