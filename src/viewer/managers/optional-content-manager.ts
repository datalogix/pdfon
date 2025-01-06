import type { OptionalContentConfig } from '@/pdfjs'
import { Manager } from './'

export class OptionalContentManager extends Manager {
  private _optionalContentConfig?: Promise<OptionalContentConfig>

  reset() {
    this._optionalContentConfig = undefined
  }

  get optionalContentConfig() {
    if (!this.pdfDocument) {
      return undefined
    }

    if (!this._optionalContentConfig) {
      this.logger.error('optionalContentConfigPromise: Not initialized yet.')

      this._optionalContentConfig = this.pdfDocument.getOptionalContentConfig({ intent: 'display' })
    }

    return this._optionalContentConfig
  }

  set optionalContentConfig(promise) {
    if (!this.pdfDocument) {
      return
    }

    const isEmpty = this._optionalContentConfig === undefined
    this._optionalContentConfig = promise

    if (!isEmpty) {
      this.dispatch('optionalcontentconfigchanged', { promise })
      this.viewer.refresh(false, { optionalContentConfigPromise: promise })
    }
  }
}
