import { Dispatcher } from '@/bus'
import type { PDFDocumentProxy } from '@/pdfjs'
import { getVisibleElements, scrollIntoView, watchScroll, type VisibleElements } from '@/utils'
import { isValidRotation, Renderable, ViewerType } from '@/viewer'
import { destroyTempCanvas } from './helpers'
import { Thumbnail } from './thumbnail'

const THUMBNAIL_SCROLL_MARGIN = -10
const THUMBNAIL_SELECTED_CLASS = 'selected'

export class ThumbnailViewer extends Dispatcher implements Renderable {
  private pdfDocument?: PDFDocumentProxy
  private thumbnails: Thumbnail[] = []
  private _pageLabels?: string[]
  private _rotation
  private currentPageNumber = 1
  private scroll

  constructor(
    protected readonly container: HTMLDivElement,
    protected readonly viewer: ViewerType,
    protected readonly abortSignal?: AbortSignal,
  ) {
    super()

    this.scroll = watchScroll(
      this.container,
      this.forceRendering.bind(this),
      abortSignal,
    )

    this.reset()
    this._rotation = viewer.rotation ?? 0
  }

  get eventBus() {
    return this.viewer.eventBus
  }

  get signal() {
    return this.abortSignal
  }

  get logger() {
    return this.viewer.logger
  }

  getThumbnail(index: number) {
    return this.thumbnails[index]
  }

  private getVisibleThumbs() {
    return getVisibleElements(this.container, this.thumbnails)
  }

  scrollIntoView(pageNumber: number) {
    if (!this.pdfDocument) {
      return
    }

    const thumbnail = this.thumbnails[pageNumber - 1]

    if (!thumbnail) {
      this.logger.error('scrollIntoView: Invalid "pageNumber" parameter.')
      return
    }

    if (pageNumber !== this.currentPageNumber) {
      const prevThumbnail = this.thumbnails[this.currentPageNumber - 1]
      prevThumbnail.div.classList.remove(THUMBNAIL_SELECTED_CLASS)
      thumbnail.div.classList.add(THUMBNAIL_SELECTED_CLASS)
    }

    const { first, last, views } = this.getVisibleThumbs()

    if (views.length > 0) {
      let shouldScroll = false

      if ((first && pageNumber <= first.id) || (last && pageNumber >= last.id)) {
        shouldScroll = true
      } else {
        for (const { id, percent } of views) {
          if (id !== pageNumber) {
            continue
          }
          shouldScroll = percent < 100
          break
        }
      }

      if (shouldScroll) {
        scrollIntoView(
          thumbnail.div,
          { top: THUMBNAIL_SCROLL_MARGIN },
        )
      }
    }

    this.currentPageNumber = pageNumber
    this.forceRendering()
  }

  get rotation() {
    return this._rotation
  }

  set rotation(rotation) {
    if (!isValidRotation(rotation)) {
      throw new Error('Invalid thumbnails rotation.')
    }

    if (!this.pdfDocument) {
      return
    }

    if (this._rotation === rotation) {
      return
    }

    this._rotation = rotation

    for (const thumbnail of this.thumbnails) {
      thumbnail.update({ rotation })
    }
  }

  cleanup() {
    if (!this.pdfDocument) {
      return
    }

    for (const thumbnail of this.thumbnails) {
      if (!thumbnail.isRenderingFinished) {
        thumbnail.reset()
      }
    }

    destroyTempCanvas()
  }

  destroy() {
    this.cleanup()
    this.reset()
  }

  private reset() {
    for (const thumbnail of this.thumbnails) {
      thumbnail.destroy()
    }

    this.pdfDocument = undefined
    this.thumbnails = []
    this.currentPageNumber = 1
    this.pageLabels = undefined
    this._rotation = 0
    this.container.textContent = ''
  }

  setDocument(pdfDocument?: PDFDocumentProxy) {
    if (this.pdfDocument) {
      this.destroy()
    }

    this.pdfDocument = pdfDocument

    if (!pdfDocument) {
      return
    }

    const firstPagePromise = pdfDocument.getPage(1)
    const optionalContentConfigPromise = pdfDocument.getOptionalContentConfig({ intent: 'display' })

    firstPagePromise
      .then((firstPdfPage) => {
        const pagesCount = pdfDocument.numPages
        const viewport = firstPdfPage.getViewport({ scale: 1 })

        for (let pageNum = 1; pageNum <= pagesCount; ++pageNum) {
          const thumbnail = new Thumbnail({
            container: this.container,
            eventBus: this.eventBus,
            l10n: this.viewer.l10n,
            layerProperties: this.viewer.layerPropertiesManager,
            id: pageNum,
            viewport: viewport.clone(),
            rotation: this.rotation,
            renderingQueue: this.viewer.renderingQueue,
            optionalContentConfigPromise,
            enableHWA: this.viewer.options.enableHWA,
            pageColors: this.viewer.pageColors,
          })

          this.thumbnails.push(thumbnail)
        }

        if (this.viewer.pageLabels) {
          this.pageLabels = this.viewer.pageLabels
        }

        this.thumbnails[0]?.setPdfPage(firstPdfPage)

        const thumbnail = this.thumbnails[this.currentPageNumber - 1]
        thumbnail.div.classList.add(THUMBNAIL_SELECTED_CLASS)
      })
      .catch((reason) => {
        this.logger.error('Unable to initialize thumbnail viewer', reason)
      })
      .finally(() => {
        queueMicrotask(() => this.scrollIntoView(this.viewer.currentPageNumber))
      })
  }

  get pageLabels() {
    return this._pageLabels
  }

  set pageLabels(labels: undefined | string[]) {
    if (!this.pdfDocument) {
      return
    }

    if (!labels) {
      this._pageLabels = undefined
    } else if (!(Array.isArray(labels) && this.pdfDocument.numPages === labels.length)) {
      this._pageLabels = undefined
      this.logger.error('PDFThumbnailViewer_setPageLabels: Invalid page labels.')
    } else {
      this._pageLabels = labels
    }

    for (let i = 0, ii = this.thumbnails.length; i < ii; i++) {
      this.thumbnails[i].setPageLabel(this._pageLabels?.[i])
    }
  }

  private async ensurePdfPageLoaded(thumbnail: Thumbnail) {
    if (!this.pdfDocument) {
      return
    }

    if (thumbnail.pdfPage) {
      return thumbnail.pdfPage
    }

    try {
      const pdfPage = await this.pdfDocument.getPage(thumbnail.id)

      if (!thumbnail.pdfPage) {
        thumbnail.setPdfPage(pdfPage)
      }

      return pdfPage
    } catch (reason) {
      this.logger.error('Unable to get page for thumbnail view', reason)
    }
  }

  private getScrollAhead(visible: VisibleElements) {
    if (visible.first?.id === 1) {
      return true
    } else if (visible.last?.id === this.thumbnails.length) {
      return false
    }

    return this.scroll.down
  }

  forceRendering() {
    const visibleThumbs = this.getVisibleThumbs()
    const scrollAhead = this.getScrollAhead(visibleThumbs)
    const thumbnail = this.viewer.renderingQueue?.getHighestPriority(
      visibleThumbs,
      this.thumbnails,
      scrollAhead,
    )

    if (thumbnail) {
      this.ensurePdfPageLoaded(thumbnail as Thumbnail)
        .then(() => this.viewer.renderingQueue?.renderView(thumbnail))
        .catch(reason => this.logger.error(this.viewer.l10n.get('error.rendering'), reason))

      return true
    }

    return false
  }
}
