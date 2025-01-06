import * as pdfjs from '@/pdfjs'
import { createElement } from '@/utils'

export class PrintService {
  private printContainer?: HTMLDivElement
  private pageStyleSheet?: HTMLStyleElement
  private scratchCanvas?: HTMLCanvasElement = createElement('canvas')
  private optionalContentConfigPromise: Promise<pdfjs.OptionalContentConfig>
  private renderProgress?: (index: number, total: number) => void

  constructor(
    private pdfDocument: pdfjs.PDFDocumentProxy,
    private pagesOverview: { width: number, height: number, rotation: number }[],
    private printResolution = 150,
    private printAnnotationStoragePromise: Promise<pdfjs.PrintAnnotationStorage | undefined> = Promise.resolve(undefined),
  ) {
    this.optionalContentConfigPromise = pdfDocument.getOptionalContentConfig({ intent: 'print' })
  }

  async print(print: typeof window.print) {
    try {
      await this.renderPages()

      await new Promise<void>((resolve) => {
        queueMicrotask(() => {
          print.call(window)

          // Delay promise resolution in case print() was not synchronous.
          setTimeout(resolve, 20) // Tidy-up.
        })
      })
    } catch {
      //
    }
  }

  layout() {
    this.printContainer = document.body.appendChild(createElement('div', 'print-container'))
    this.printContainer.parentElement?.setAttribute('data-printing', 'true')

    const { width, height } = this.pagesOverview[0]
    const hasEqualPageSizes = this.pagesOverview.every(size => size.width === width && size.height === height)

    if (!hasEqualPageSizes) {
      console.warn('Not all pages have the same size. The printed result may be incorrect!')
    }

    this.pageStyleSheet = createElement('style')
    this.pageStyleSheet.textContent = `@page { size: ${width}pt ${height}pt;}`

    document.head.append(this.pageStyleSheet)
  }

  destroy() {
    this.printContainer?.parentElement?.removeAttribute('data-printing')
    this.printContainer?.remove()
    this.printContainer = undefined

    this.pageStyleSheet?.remove()
    this.pageStyleSheet = undefined

    if (this.scratchCanvas) {
      this.scratchCanvas.width = this.scratchCanvas.height = 0
      this.scratchCanvas = undefined
    }
  }

  onRenderProgress(fn: typeof this.renderProgress) {
    this.renderProgress = fn
  }

  private renderPages() {
    if (this.pdfDocument.isPureXfa) {
      this.getXfaHtmlForPrinting()
      return Promise.resolve()
    }

    let currentPage = 0
    const pageCount = this.pagesOverview.length

    const renderNextPage = (resolve: any, reject: any) => {
      if (++currentPage > pageCount) {
        this.renderProgress?.(pageCount, pageCount)
        resolve()
        return
      }

      this.renderProgress?.(currentPage, pageCount)

      this.renderPage(currentPage)
        .then(this.useRenderedPage.bind(this))
        .then(() => renderNextPage(resolve, reject), reject)
    }

    return new Promise(renderNextPage)
  }

  private async useRenderedPage() {
    const img = createElement('img')
    this.scratchCanvas?.toBlob((blob) => {
      img.src = URL.createObjectURL(blob!)
    })

    const wrapper = createElement('div', 'page-printed')
    wrapper.append(img)
    this.printContainer?.append(wrapper)

    const { promise, resolve, reject } = Promise.withResolvers()
    img.onload = resolve
    img.onerror = reject

    try {
      await promise
    } catch {
      //
    } finally {
      URL.revokeObjectURL(img.src)
    }
  }

  private getXfaHtmlForPrinting() {
    const xfaHtml = this.pdfDocument.allXfaHtml
    const scale = Math.round(pdfjs.PixelsPerInch.PDF_TO_CSS_UNITS * 100) / 100

    if (
      !xfaHtml
      || !('children' in xfaHtml)
      || !(xfaHtml.children instanceof Array)
      || xfaHtml.children.length === 0
    ) {
      return
    }

    for (const xfaPage of xfaHtml.children) {
      const page = createElement('div', 'xfa-page-printed')
      this.printContainer?.append(page)

      const viewport = pdfjs.getXfaPageViewport(xfaPage, { scale })
      const xfaLayerDiv = createElement('div')

      pdfjs.XfaLayer.render({
        viewport: viewport.clone({ dontFlip: true }),
        div: xfaLayerDiv,
        xfaHtml: xfaPage,
        annotationStorage: this.pdfDocument.annotationStorage,
        intent: 'print',
      } as pdfjs.XfaLayerParameters)

      page.append(xfaLayerDiv)
    }
  }

  private async renderPage(pageNumber: number) {
    const PRINT_UNITS = this.printResolution / pdfjs.PixelsPerInch.PDF
    const size = this.pagesOverview[pageNumber - 1]
    const optionalContentConfigPromise = this.optionalContentConfigPromise
    const scratchCanvas = this.scratchCanvas!

    scratchCanvas.width = Math.floor(size.width * PRINT_UNITS)
    scratchCanvas.height = Math.floor(size.height * PRINT_UNITS)

    const ctx = scratchCanvas.getContext('2d')!
    ctx.save()
    ctx.fillStyle = 'rgb(255, 255, 255)'
    ctx.fillRect(0, 0, scratchCanvas!.width, scratchCanvas.height)
    ctx.restore()

    try {
      const [pdfPage, printAnnotationStorage] = await Promise.all([
        this.pdfDocument.getPage(pageNumber),
        this.printAnnotationStoragePromise,
      ])

      const renderTask = pdfPage.render({
        canvasContext: ctx,
        transform: [PRINT_UNITS, 0, 0, PRINT_UNITS, 0, 0],
        viewport: pdfPage.getViewport({ scale: 1, rotation: size.rotation }),
        intent: 'print',
        annotationMode: pdfjs.AnnotationMode.ENABLE_STORAGE,
        optionalContentConfigPromise,
        printAnnotationStorage,
      })

      await renderTask.promise
    } catch (reason) {
      if (!(reason instanceof pdfjs.RenderingCancelledException)) {
        console.error(reason)
      }

      throw reason
    }
  }
}
