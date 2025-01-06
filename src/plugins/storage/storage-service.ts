import type { InitializerOptions } from '@/viewer'
import { name } from '../../../package.json'

export type Database = InitializerOptions & Record<string, any>
export type DatabaseKeys = keyof Database

export class StorageService {
  private database: Database
  private key: string

  constructor(
    fingerprint: string,
    private driver: Storage = localStorage,
    storagePrefix = name,
  ) {
    this.key = `${storagePrefix}-${fingerprint}`
    this.database = JSON.parse(this.driver.getItem(this.key) || '{}')
  }

  private write() {
    this.driver.setItem(this.key, JSON.stringify(this.database))
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
