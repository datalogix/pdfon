import { Initializer, type InitializerParams } from '@/viewer'
import { StorageService } from './storage-service'

export class StorageInitializer extends Initializer {
  private _storageService?: StorageService

  get storageService() {
    return this._storageService
  }

  apply({ pdfDocument, viewer, options }: InitializerParams) {
    this._storageService = new StorageService(pdfDocument.fingerprints[0])
    viewer.dispatch('storageinitialized', { storage: this._storageService })
    const data = Object.fromEntries(Object.entries(this._storageService.all()).filter(([_, v]) => v !== undefined))

    return {
      ...options,
      ...data,
    }
  }
}
