import type { InitializerOptions } from '@/viewer'
import { name } from '../../../package.json'

export type Database = InitializerOptions & Record<string, any>
export type DatabaseKeys = keyof Database

export class StorageService {
  private database!: Database
  private key!: string

  constructor(
    fingerprint: string,
    prefix: string = name,
    private driver: Storage = localStorage,
  ) {
    this.setKey(fingerprint, prefix)
  }

  private write() {
    this.driver.setItem(this.key, JSON.stringify(this.database))
  }

  setKey(fingerprint: string, prefix: string = name) {
    this.key = `${prefix}-${fingerprint}`
    this.database = JSON.parse(this.driver.getItem(this.key) || '{}')
  }

  all() {
    return this.database
  }

  get<K extends DatabaseKeys>(key: K, defaultValue?: Database[K]) {
    return this.database[key] !== undefined ? this.database[key] : defaultValue
  }

  set<K extends DatabaseKeys>(keyOrProperties: K | Partial<Database>, value?: Database[K]) {
    if (typeof keyOrProperties === 'string') {
      this.database[keyOrProperties] = value!
    } else {
      Object.assign(this.database, keyOrProperties)
    }
    this.write()
  }
}
