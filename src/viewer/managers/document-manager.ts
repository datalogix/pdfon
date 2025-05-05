import * as pdfjs from '@/pdfjs'
import { WAIT_LOAD_DOCUMENT } from '@/config'
import { defineWorker, getFromCache, saveInCache, waitOnEventOrTimeout } from '@/utils'
import type { InitializerOptions } from '../initializers'
import { Manager } from './'

export class DocumentManager extends Manager {
  private _pdfDocument?: pdfjs.PDFDocumentProxy
  private loadingTask?: pdfjs.PDFDocumentLoadingTask

  init() {
    this.on('Started', () => {
      waitOnEventOrTimeout(this.eventBus, 'DocumentOpen', WAIT_LOAD_DOCUMENT).then((type) => {
        if (type === 'timeout') {
          this.dispatch('DocumentEmpty')
        }
      })
    }, { once: true })
  }

  reset() {
    this._pdfDocument = undefined
  }

  getDocument() {
    return this._pdfDocument
  }

  async closeDocument() {
    if (!this.pdfDocument && !this.loadingTask) {
      return
    }

    this.dispatch('DocumentClose', { pdfDocument: this.pdfDocument })

    if (this.pdfDocument) {
      this.dispatch('DocumentDestroy', { pdfDocument: this.pdfDocument })
      this.viewer.reset()
    }

    if (this.loadingTask) {
      await this.loadingTask.destroy()

      this.loadingTask = undefined
    }
  }

  async openDocument(
    documentType: pdfjs.DocumentType,
    documentFilename?: string,
    options: InitializerOptions = {},
  ) {
    defineWorker()

    documentType = await this.openDocumentFromCache(documentType, options.disabledCache)

    this.dispatch('DocumentOpen', { documentType, documentFilename, options })

    await this.closeDocument()

    const loadingTask = this.loadingTask = pdfjs.getDocument(documentType)

    this.dispatch('DocumentLoad', { loadingTask, documentType, documentFilename, options })

    try {
      const pdfDocument = await loadingTask.promise
      this._pdfDocument = pdfDocument
      this.dispatch('DocumentInit', { pdfDocument, documentType, documentFilename, options })
    } catch (reason) {
      if (loadingTask !== this.loadingTask) {
        return
      }

      let key = 'error.loading'

      if (reason instanceof pdfjs.InvalidPDFException) {
        key = 'error.invalid-file'
      } else if (reason instanceof pdfjs.MissingPDFException) {
        key = 'error.missing-file'
      } else if (reason instanceof pdfjs.UnexpectedResponseException) {
        key = 'error.unexpected-response'
      } else if (reason instanceof Error && reason.name === 'PasswordException') {
        key = 'error.password'
      }

      this.dispatch('DocumentError', { message: this.translate(key), reason })

      throw reason
    }
  }

  private async openDocumentFromCache(documentType: pdfjs.DocumentType, disabledCache?: boolean) {
    if (!(typeof documentType === 'string' || documentType instanceof URL)) {
      return documentType
    }

    if (documentType.toString().startsWith('blob:')) {
      return documentType
    }

    if (disabledCache === true) {
      return documentType
    }

    const fromCache = await getFromCache(documentType)

    if (fromCache === documentType) {
      this.on('DocumentInit', async ({ pdfDocument }) => {
        const blob = new Blob([await pdfDocument.getData()])
        await saveInCache(documentType, new Response(blob))
      }, { once: true })
    }

    return fromCache
  }
}
