import type { PDFDocumentProxy } from '@/pdfjs'
import type { ScrollMode, SpreadMode } from '@/enums'
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

export type InitializerParams = {
  pdfDocument: PDFDocumentProxy
  viewer: ViewerType
  options: InitializerOptions
}

export abstract class Initializer {
  get priority() {
    return 0
  }

  abstract apply(params: InitializerParams): Promise<InitializerOptions> | InitializerOptions
}
