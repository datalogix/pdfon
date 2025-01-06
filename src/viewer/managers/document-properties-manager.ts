import * as pdfjs from '@/pdfjs'
import { isEmbedded } from '@/utils'
import { Manager } from './'

export class DocumentPropertiesManager extends Manager {
  private _documentType?: pdfjs.DocumentType
  private _documentTitle?: string
  private _documentUrl?: string
  private _documentFilename?: string
  private _documentFilesize?: number
  private _documentInfo?: Record<string, any>
  private _documentMetadata?: pdfjs.Metadata

  get documentType() {
    return this._documentType
  }

  get documentTitle() {
    if (this._documentTitle !== undefined) {
      return this._documentTitle
    }

    this._documentTitle = this.documentFilename

    if (!this._documentTitle) {
      try {
        this._documentTitle = decodeURIComponent(pdfjs.getFilenameFromUrl(this.documentUrl))
      } catch {
        //
      }
    }

    return this._documentTitle
  }

  get documentUrl() {
    if (this._documentUrl !== undefined) {
      return this._documentUrl
    }

    if (this._documentType instanceof ArrayBuffer) {
      this._documentUrl = ''
    } else if (typeof this._documentType === 'string' || this._documentType instanceof URL) {
      this._documentUrl = this._documentType.toString()
    } else {
      this._documentUrl = String(this._documentType?.url || '')
    }

    return this._documentUrl
  }

  get documentFilename() {
    return (this._documentFilename ||= pdfjs.getPdfFilenameFromUrl(this.documentUrl || '', ''))
  }

  get documentFilesize() {
    return this._documentFilesize
  }

  get documentInfo() {
    return this._documentInfo
  }

  get documentMetadata() {
    return this._documentMetadata
  }

  init() {
    this.on('documentinit', ({ pdfDocument, documentType, filename }) => {
      this.setupDocumentProperties(pdfDocument, documentType, filename)
    })
  }

  reset() {
    this._documentType = undefined
    this._documentTitle = undefined
    this._documentUrl = undefined
    this._documentFilename = undefined
    this._documentFilesize = undefined
    this._documentInfo = undefined
    this._documentMetadata = undefined
  }

  private setupDocumentProperties(
    pdfDocument: pdfjs.PDFDocumentProxy,
    documentType: pdfjs.DocumentType,
    documentFilename?: string,
  ) {
    this._documentType = documentType
    if (documentFilename?.trim()) this._documentFilename = documentFilename

    if (!isEmbedded() && this.documentTitle) {
      document.title = this.documentTitle
      this.dispatch('documenttitleupdated', { title: this.documentTitle })
    }

    pdfDocument.getDownloadInfo().then(({ length }) => {
      this._documentFilesize = length
      this.pagesManager.firstPagePromise?.then(() => this.dispatch('documentloaded'))
    })

    pdfDocument.getMetadata().then((data) => {
      if ('contentDispositionFilename' in data && data.contentDispositionFilename) {
        this._documentFilename ??= data.contentDispositionFilename as string
      }

      if ('contentLength' in data && data.contentLength) {
        this._documentFilesize ??= data.contentLength as number
      }

      this._documentInfo = data.info
      this._documentMetadata = data.metadata

      this.logger.info(
        `PDF ${pdfDocument.fingerprints[0]} [${this._documentInfo.PDFFormatVersion}`
        + `${(this._documentInfo.Producer || '-').trim()} / ${(this._documentInfo.Creator || '-').trim()}]`,
        null,
        true,
      )

      if (this._documentInfo.IsXFAPresent && !this._documentInfo?.IsAcroFormPresent && !pdfDocument.isPureXfa) {
        if (pdfDocument.loadingParams.enableXfa) {
          this.logger.warn('Warning: XFA Foreground documents are not supported')
        } else {
          this.logger.warn('Warning: XFA support is not enabled')
        }
      } else if ((this._documentInfo?.IsAcroFormPresent || this._documentInfo?.IsXFAPresent) && !this.annotationManager.renderForms) {
        this.logger.warn('Warning: Interactive form support is not enabled')
      }

      if (this._documentInfo?.IsSignaturesPresent) {
        this.logger.warn('Warning: Digital signatures validation is not supported')
      }

      this.dispatch('metadataloaded', data)
    })
  }
}
