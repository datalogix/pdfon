import * as pdfjs from '@/pdfjs'
import { isEmbedded } from '@/utils'
import { Manager } from './'

export class DocumentPropertiesManager extends Manager {
  private _documentType?: pdfjs.DocumentType
  private _documentFingerprint?: string
  private _documentTitle?: string
  private _documentUrl?: string
  private _documentFilename?: string
  private _documentFilesize?: number
  private _documentInfo?: Record<string, any>
  private _documentMetadata?: pdfjs.Metadata
  private _documentAuthor?: string
  private _documentSubject?: string
  private _documentKeywords?: string
  private _documentCreator?: string
  private _documentProducer?: string

  get documentType() {
    return this._documentType
  }

  get documentFingerprint() {
    return this._documentFingerprint
  }

  get documentTitle() {
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
    return this._documentFilename ||= pdfjs.getPdfFilenameFromUrl(this.documentUrl || '', '')
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

  get documentAuthor() {
    return this._documentAuthor ||= this._documentMetadata?.get('dc:creator')?.join('\n') || this.documentInfo?.Author
  }

  get documentSubject() {
    return this._documentSubject ||= this._documentMetadata?.get('dc:subject')?.join('\n') || this.documentInfo?.Subject
  }

  get documentKeywords() {
    return this._documentKeywords ||= this._documentMetadata?.get('dc:keywords') || this.documentInfo?.Keywords
  }

  get documentCreator() {
    return this._documentCreator ||= this._documentMetadata?.get('xmp:creatortool') || this.documentInfo?.Creator
  }

  get documentProducer() {
    return this._documentProducer ||= this._documentMetadata?.get('pdf:producer') || this.documentInfo?.Producer
  }

  init() {
    this.on('DocumentInit', ({ pdfDocument, documentType, documentFilename }) => {
      this.setupDocumentProperties(pdfDocument, documentType, documentFilename)
    })

    if ((this.options.enableTitleUpdate ?? true) && !isEmbedded()) {
      this.on('DocumentTitleUpdated', ({ title }) => {
        document.title = title
      })
    }
  }

  reset() {
    this._documentType = undefined
    this._documentTitle = undefined
    this._documentUrl = undefined
    this._documentFilename = undefined
    this._documentFilesize = undefined
    this._documentInfo = undefined
    this._documentMetadata = undefined
    this._documentAuthor = undefined
    this._documentSubject = undefined
    this._documentKeywords = undefined
    this._documentCreator = undefined
    this._documentProducer = undefined
  }

  private getDocumentTitle() {
    const docTitle = this.documentMetadata?.get('dc:title')

    if (docTitle && docTitle !== 'Untitled' && !/[\uFFF0-\uFFFF]/g.test(docTitle)) {
      return docTitle
    }

    if (this.documentInfo?.Title) {
      return this.documentInfo?.Title
    }

    try {
      return decodeURIComponent(pdfjs.getFilenameFromUrl(this.documentUrl))
    } catch {
      //
    }
  }

  private setupDocumentProperties(
    pdfDocument: pdfjs.PDFDocumentProxy,
    documentType: pdfjs.DocumentType,
    documentFilename?: string,
  ) {
    this._documentType = documentType
    this._documentFingerprint = pdfDocument.fingerprints[0] ?? undefined

    if (documentFilename?.trim()) this._documentFilename = documentFilename

    pdfDocument.getDownloadInfo().then(({ length }) => {
      this._documentFilesize = length
      this.pagesManager.firstPagePromise?.then(() => this.dispatch('DocumentLoaded'))
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
      this._documentTitle = this.getDocumentTitle()

      this.dispatch('DocumentTitleUpdated', { title: this._documentTitle })

      this.logger.info(
        `PDF ${this._documentFingerprint} [${this._documentInfo.PDFFormatVersion}`
        + `${(this.documentProducer || '-').trim()} / ${(this.documentCreator || '-').trim()}]`,
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

      this.dispatch('MetadataLoaded', data)
    })
  }
}
