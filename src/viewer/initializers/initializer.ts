import { Dispatcher } from '@/bus'
import type { ScrollMode, SpreadMode } from '@/enums'
import type { PDFDocumentProxy } from '@/pdfjs'
import type { ViewerType } from '../types'

export type InitializerOptions = Partial<{
  [key: string]: any
  scroll?: ScrollMode
  spread?: SpreadMode
  rotation?: number
  page?: number
  scale?: number | string
  scrollTop?: number
  scrollLeft?: number
}>

export type InitializerExecuteResult = void | ((options: InitializerOptions) => void)

export type InitializerType = (Initializer | (new () => Initializer))

export abstract class Initializer extends Dispatcher {
  private _pdfDocument?: PDFDocumentProxy
  private _viewer?: ViewerType

  get priority() {
    return 0
  }

  get pdfDocument() {
    return this._pdfDocument!
  }

  get viewer() {
    return this._viewer!
  }

  get eventBus() {
    return this.viewer.eventBus
  }

  init(pdfDocument: PDFDocumentProxy, viewer: ViewerType) {
    this._pdfDocument = pdfDocument
    this._viewer = viewer
  }

  prepare(options: InitializerOptions): Promise<InitializerOptions> | InitializerOptions {
    return options
  }

  execute(_options: InitializerOptions): Promise<InitializerExecuteResult> | InitializerExecuteResult {
    //
  }

  finish(_options: InitializerOptions): Promise<void> | void {
    //
  }
}
