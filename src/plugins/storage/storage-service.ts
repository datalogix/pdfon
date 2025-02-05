import type { InitializerOptions } from '@/viewer'
import { name } from '../../../package.json'
import { deserialize, serialize } from '@/utils'

export class StorageService<TDatabase extends Record<string, any> = InitializerOptions> {
  private database: TDatabase = {} as TDatabase
  private key: string = ''

  constructor(
    fingerprint: string,
    prefix: string = name,
    private driver: Storage = localStorage,
  ) {
    this.setKey(fingerprint, prefix)
  }

  private write() {
    this.driver.setItem(this.key, serialize(this.database))
  }

  setKey(fingerprint: string, prefix: string = name) {
    this.key = `${prefix}-${fingerprint}`
    this.database = deserialize(this.driver.getItem(this.key) ?? '{}')
  }

  all() {
    return this.database
  }

  get<K extends keyof TDatabase>(key: K, defaultValue?: TDatabase[K]) {
    return key in this.database ? this.database[key] : defaultValue
  }

  set<K extends keyof TDatabase>(keyOrProperties: K | Partial<TDatabase>, value?: TDatabase[K]) {
    if (typeof keyOrProperties === 'string') {
      this.database[keyOrProperties as K] = value!
    } else {
      Object.assign(this.database, keyOrProperties)
    }
    this.write()
  }
}
