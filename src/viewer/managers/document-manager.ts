import * as pdfjs from '@/pdfjs'
import { WAIT_LOAD_DOCUMENT } from '@/config'
import { defineWorker, waitOnEventOrTimeout } from '@/utils'
import { Manager } from './'

export class DocumentManager extends Manager {
  private _pdfDocument?: pdfjs.PDFDocumentProxy
  private loadingTask?: pdfjs.PDFDocumentLoadingTask

  init() {
    waitOnEventOrTimeout(this.eventBus, 'documentopen', WAIT_LOAD_DOCUMENT).then((type) => {
      if (type === 'timeout') {
        this.dispatch('documentempty')
      }
    })
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

    this.dispatch('documentclose', { pdfDocument: this.pdfDocument })

    if (this.pdfDocument) {
      this.dispatch('documentdestroy', { pdfDocument: this.pdfDocument })
      this.viewer.reset()
    }

    if (this.loadingTask) {
      await this.loadingTask.destroy()

      this.loadingTask = undefined
    }
  }

  async openDocument(documentType?: pdfjs.DocumentType, documentFilename?: string) {
    defineWorker()

    this.dispatch('documentopen', { documentType, documentFilename })

    await this.closeDocument()

    this.dispatch('documentload', { documentType, documentFilename })

    const loadingTask = this.loadingTask = pdfjs.getDocument(documentType)

    loadingTask.onProgress = ({ loaded, total }: { loaded: number, total: number }) => {
      this.dispatch('documentprogress', { loaded, total })
    }

    try {
      const pdfDocument = await loadingTask.promise
      this._pdfDocument = pdfDocument
      this.dispatch('documentinit', { pdfDocument, documentType, documentFilename })
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
      }

      this.dispatch('documenterror', { message: this.l10n.get(key), reason })

      throw reason
    }
  }
}
