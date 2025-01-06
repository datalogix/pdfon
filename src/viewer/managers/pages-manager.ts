import * as pdfjs from '@/pdfjs'
import * as constants from '@/config'
import { ScrollMode, SpreadMode } from '@/enums'
import { initializePermissions, isPortraitOrientation, onePageRenderedOrForceFetch, VisibleElements } from '@/utils'
import { Page, PageUpdate } from '../page'
import { Manager } from './'

export class PagesManager extends Manager {
  private _pages: Page[] = []
  private _currentPageNumber = 1
  private firstPageCapability: PromiseWithResolvers<pdfjs.PDFPageProxy> = Promise.withResolvers()
  private onePageRenderedCapability: PromiseWithResolvers<{ timestamp: number }> = Promise.withResolvers()
  private pagesCapability: PromiseWithResolvers<void> = Promise.withResolvers()
  private abortController?: AbortController

  get firstPagePromise() {
    return this.pdfDocument ? this.firstPageCapability.promise : null
  }

  get onePageRendered() {
    return this.pdfDocument ? this.onePageRenderedCapability.promise : null
  }

  get pagesPromise() {
    return this.pdfDocument ? this.pagesCapability.promise : null
  }

  get signal() {
    return this.abortController?.signal
  }

  init() {
    this.on('documentinit', ({ pdfDocument }) => this.setupPages(pdfDocument))
    this.on('documentdestroy', () => this.dispatch('pagesdestroy'), { signal: this.options.abortSignal })
  }

  reset() {
    this._pages = []
    this._currentPageNumber = 1
    this.firstPageCapability = Promise.withResolvers()
    this.onePageRenderedCapability = Promise.withResolvers()
    this.pagesCapability = Promise.withResolvers()
    this.abortController?.abort()
    this.abortController = undefined
  }

  refresh(params: PageUpdate) {
    for (const page of this.pages) {
      page.update(params)
    }
  }

  update(visible: VisibleElements) {
    const isSimpleLayout = this.spreadMode === SpreadMode.NONE
      && (this.scrollMode === ScrollMode.PAGE || this.scrollMode === ScrollMode.VERTICAL)

    const currentId = this.currentPageNumber
    let stillFullyVisible = false

    for (const view of visible.views) {
      if (view.percent < 100) {
        break
      }

      if (view.id === currentId && isSimpleLayout) {
        stillFullyVisible = true
        break
      }
    }

    this.setCurrentPageNumber(stillFullyVisible ? currentId : visible.views[0].id)
  }

  get pages() {
    return this._pages
  }

  get pagesReady() {
    return this.pages.every(page => page?.pdfPage)
  }

  get pagesCount() {
    return this.pages.length
  }

  getPage(index: number) {
    return this.pages[index]
  }

  get currentPageNumber() {
    return this._currentPageNumber
  }

  set currentPageNumber(val: number) {
    if (!Number.isInteger(val)) {
      throw new Error('Invalid page number.')
    }

    if (!this.pdfDocument) {
      return
    }

    if (!this.setCurrentPageNumber(val, true)) {
      this.logger.error(`currentPageNumber: '${val}' is not a valid page.`)
    }
  }

  setCurrentPageNumber(val: number, resetCurrentPage = false) {
    if (this.currentPageNumber === val) {
      if (resetCurrentPage) {
        this.resetCurrentPage()
      }

      return true
    }

    if (!(0 < val && val <= this.pagesCount)) {
      return false
    }

    const previous = this.currentPageNumber

    this._currentPageNumber = val
    this.dispatch('pagechanging', {
      pageNumber: val,
      pageLabel: this.pageLabelsManager.pageLabels?.[val - 1] ?? null,
      previous,
    })

    if (resetCurrentPage) {
      this.resetCurrentPage()
    }

    return true
  }

  resetCurrentPage() {
    const page = this.pages[this.currentPageNumber - 1]

    if (this.isInPresentationMode && this.currentScaleValue) {
      this.scaleManager.setScale(this.currentScaleValue, { noScroll: true })
    }

    this.scrollManager.scrollIntoView(page)
  }

  get hasEqualPageSizes() {
    const firstPage = this.pages[0]

    for (let i = 1, ii = this.pages.length; i < ii; ++i) {
      const page = this.pages[i]
      if (page.width !== firstPage.width || page.height !== firstPage.height) {
        return false
      }
    }

    return true
  }

  hasNextPage() {
    return this.currentPageNumber < this.pagesCount
  }

  hasPreviousPage() {
    return this.currentPageNumber > 1
  }

  nextPage() {
    if (!this.hasNextPage()) return false

    const advance = this.getPageAdvance(this.currentPageNumber, false) || 1
    this.currentPageNumber = Math.min(this.currentPageNumber + advance, this.pagesCount)

    return true
  }

  previousPage() {
    if (!this.hasPreviousPage()) return false

    const advance = this.getPageAdvance(this.currentPageNumber, true) || 1
    this.currentPageNumber = Math.max(this.currentPageNumber - advance, 1)

    return true
  }

  firstPage() {
    this.currentPageNumber = 1
  }

  lastPage() {
    this.currentPageNumber = this.pagesCount
  }

  getPagesOverview() {
    let initialOrientation: boolean | undefined = undefined

    return this.pages.map((page) => {
      const viewport = page.pdfPage!.getViewport({ scale: 1 })
      const orientation = isPortraitOrientation(viewport)
      const enablePrintAutoRotate = this.options.enablePrintAutoRotate ?? true

      if (initialOrientation === undefined) {
        initialOrientation = orientation
      } else if (enablePrintAutoRotate && orientation !== initialOrientation) {
        return {
          width: viewport.height,
          height: viewport.width,
          rotation: (viewport.rotation - 90) % 360,
        }
      }

      return {
        width: viewport.width,
        height: viewport.height,
        rotation: viewport.rotation,
      }
    })
  }

  private getPageAdvance(currentPageNumber: number, previous = false) {
    switch (this.scrollMode) {
      case ScrollMode.WRAPPED:
      {
        const visible = this.scrollManager.getVisiblePages()
        const pageLayout = new Map()

        for (const view of visible.views) {
          if (view.percent === 0 || view.widthPercent < 100) {
            continue
          }

          let yArray = pageLayout.get(view.y)

          if (!yArray) {
            pageLayout.set(view.y, yArray ||= [])
          }

          yArray.push(view.id)
        }

        for (const yArray of pageLayout.values()) {
          const currentIndex = yArray.indexOf(currentPageNumber)
          if (currentIndex === -1) {
            continue
          }

          const numPages = yArray.length
          if (numPages === 1) {
            break
          }

          if (previous) {
            for (let i = currentIndex - 1, ii = 0; i >= ii; i--) {
              const currentId = yArray[i],
                expectedId = yArray[i + 1] - 1
              if (currentId < expectedId) {
                return currentPageNumber - expectedId
              }
            }
          } else {
            for (let i = currentIndex + 1, ii = numPages; i < ii; i++) {
              const currentId = yArray[i],
                expectedId = yArray[i - 1] + 1
              if (currentId > expectedId) {
                return expectedId - currentPageNumber
              }
            }
          }

          if (previous) {
            const firstId = yArray[0]
            if (firstId < currentPageNumber) {
              return currentPageNumber - firstId + 1
            }
          } else {
            const lastId = yArray[numPages - 1]
            if (lastId > currentPageNumber) {
              return lastId - currentPageNumber + 1
            }
          }

          break
        }

        break
      }

      case ScrollMode.HORIZONTAL:
        break

      case ScrollMode.PAGE:
      case ScrollMode.VERTICAL:
      {
        if (this.spreadMode === SpreadMode.NONE) {
          break
        }

        const parity = this.spreadMode - 1

        if (previous && currentPageNumber % 2 !== parity) {
          break
        } else if (!previous && currentPageNumber % 2 === parity) {
          break
        }

        const visible = this.scrollManager.getVisiblePages()
        const expectedId = previous ? currentPageNumber - 1 : currentPageNumber + 1

        for (const view of visible.views) {
          if (view.id !== expectedId) {
            continue
          }

          if (view.percent > 0 && view.widthPercent === 100) {
            return 2
          }

          break
        }

        break
      }
    }

    return 1
  }

  private setupPages(pdfDocument: pdfjs.PDFDocumentProxy) {
    const pagesCount = pdfDocument.numPages
    const firstPagePromise = pdfDocument.getPage(1)
    const optionalContentConfigPromise = pdfDocument.getOptionalContentConfig({ intent: 'display' })
    const permissionsPromise = this.options.enablePermissions ? pdfDocument.getPermissions() : Promise.resolve()

    this.abortController = new AbortController()
    const { signal } = this.abortController

    if (pagesCount > constants.FORCE_SCROLL_MODE_PAGE) {
      this.logger.warn('Forcing PAGE-scrolling for performance reasons, given the length of the document.')
      const mode = this.scrollManager.scrollMode = ScrollMode.PAGE
      this.dispatch('scrollmodechanged', { mode })
    }

    this.pagesCapability.promise.then(() => {
      this.dispatch('pagesloaded', { pagesCount })
    }, () => { })

    const onBeforeDraw = (evt: { pageNumber: number }) => {
      const page = this.pages[evt.pageNumber - 1]
      if (!page) return
      this.renderManager.buffer.push(page)
    }

    const onAfterDraw = (evt: { cssTransform: boolean, timestamp: number }) => {
      if (evt.cssTransform) return
      this.onePageRenderedCapability.resolve({ timestamp: evt.timestamp })
      this.off('pagerendered', onAfterDraw)
    }

    this.on('pagerender', onBeforeDraw, { signal })
    this.on('pagerendered', onAfterDraw, { signal })

    Promise.all([firstPagePromise, permissionsPromise]).then(([firstPdfPage, permissions]) => {
      if (pdfDocument !== this.pdfDocument) {
        return
      }

      this.firstPageCapability.resolve(firstPdfPage)
      this.optionalContentManager.optionalContentConfig = optionalContentConfigPromise

      const params = initializePermissions(permissions ?? undefined, this.options)
      const viewport = firstPdfPage.getViewport({ scale: this.currentScale * pdfjs.PixelsPerInch.PDF_TO_CSS_UNITS })

      this.dispatch('firstpageloaded', { pdfDocument, firstPdfPage, viewport, ...params })

      const layerBuilders = this.layerBuildersManager.layersToArray()
      const container = this.scrollMode === ScrollMode.PAGE ? undefined : this.viewerContainer

      for (let pageNum = 1; pageNum <= pagesCount; ++pageNum) {
        this.pages.push(new Page({
          id: pageNum,
          viewport: viewport.clone(),
          eventBus: this.eventBus,
          l10n: this.viewer.l10n,
          container,
          scale: this.currentScale,
          rotation: this.rotation,
          optionalContentConfigPromise,
          renderingQueue: this.renderingQueue,
          maxCanvasPixels: this.options.maxCanvasPixels,
          textLayerMode: params.textLayerMode,
          imageResourcesPath: this.options.imageResourcesPath,
          annotationMode: params.annotationMode,
          layerBuilders,
          layerProperties: this.viewer.layerPropertiesManager,
          enableHWA: this.options.enableHWA,
          pageColors: this.viewer.pageColors,
        }))
      }

      this.pages[0]?.setPdfPage(firstPdfPage)

      if (this.scrollManager.scrollMode === ScrollMode.PAGE) {
        this.scrollManager.ensurePageVisible()
      } else if (this.spreadManager.spreadMode !== SpreadMode.NONE) {
        this.spreadManager.updateSpreadMode()
      }

      if (this.scaleManager.currentScaleValue) {
        this.scaleManager.setScale(this.scaleManager.currentScaleValue, { noScroll: false })
      }

      onePageRenderedOrForceFetch(
        this.viewerContainer,
        this.scrollManager.getVisiblePages(),
        this.onePageRenderedCapability.promise,
        signal,
      ).then(async () => {
        if (pdfDocument !== this.pdfDocument) {
          return
        }

        this.dispatch('onepagerendered', { pdfDocument, firstPdfPage, viewport, ...params })

        if (pdfDocument.loadingParams.disableAutoFetch || pagesCount > constants.FORCE_LAZY_PAGE_INIT) {
          this.pagesCapability.resolve()
          return
        }

        let getPagesLeft = pagesCount - 1

        if (getPagesLeft <= 0) {
          this.pagesCapability.resolve()
          return
        }

        for (let pageNum = 2; pageNum <= pagesCount; ++pageNum) {
          const promise = pdfDocument.getPage(pageNum).then((pdfPage) => {
            const page = this.pages[pageNum - 1]
            if (!page.pdfPage) {
              page.setPdfPage(pdfPage)
            }
            if (--getPagesLeft === 0) {
              this.pagesCapability.resolve()
            }
          }, (reason) => {
            this.logger.error(`Unable to get page ${pageNum} to initialize viewer`, reason)
            if (--getPagesLeft === 0) {
              this.pagesCapability.resolve()
            }
          })

          if (pageNum % constants.PAUSE_EAGER_PAGE_INIT === 0) {
            await promise
          }
        }
      })

      this.dispatch('pagesinit', { pdfDocument })
      queueMicrotask(() => this.viewer.update())
    }).catch((reason) => {
      this.logger.error('Unable to initialize viewer', reason)
      this.pagesCapability.reject(reason)
    })
  }
}
