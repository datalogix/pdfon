import { Plugin } from '../plugin'
import { StorageInitializer } from './storage-initializer'
import { StorageService } from './storage-service'

export class StoragePlugin extends Plugin {
  protected initializer = new StorageInitializer()
  private _storage?: StorageService

  get storage() {
    return this._storage
  }

  protected init(): Promise<void> | void {
    this.on('documentinit', ({ pdfDocument }) => {
      this._storage = new StorageService(pdfDocument.fingerprints[0] as string)
      this.dispatch('storageinitialized', { storage: this._storage })
    })

    this.on('documentdestroy', () => {
      this._storage = undefined
    })
  }
}
