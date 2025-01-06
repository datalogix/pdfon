import { PixelsPerInch } from '@/pdfjs'
import { FORCE_SCROLL_MODE_PAGE, SCROLLBAR_PADDING, VERTICAL_PADDING } from '@/config'
import { ScrollMode, SpreadMode } from '@/enums'
import { createElement, getVisibleElements, scrollIntoView, watchScroll, type VisibleElements } from '@/utils'
import type { Page } from '../page'
import { Manager } from './'

export function isValidScrollMode(mode: number) {
  return (
    Number.isInteger(mode)
    && Object.values(ScrollMode).includes(mode)
    && mode !== ScrollMode.UNKNOWN
  )
}

export type ScrollDestination = undefined |
  ['XYZ', number, number, string | number | undefined] |
  ['Fit'] |
  ['FitB'] |
  ['FitH', number | undefined] |
  ['FitBH', number | undefined] |
  ['FitV', number] |
  ['FitBV', number] |
  ['FitR', number, number, number, number]

export type ScrollModePageState = {
  previousPageNumber: number
  scrollDown: boolean
  pages: Page[]
}

export class ScrollManager extends Manager {
  private scrollModePageState: ScrollModePageState = {
    previousPageNumber: 1,
    scrollDown: true,
    pages: [],
  }

  private _scrollMode = ScrollMode.VERTICAL
  private previousScrollMode = ScrollMode.UNKNOWN
  private scroll = { right: true, down: true }

  init() {
    this.scroll = watchScroll(
      this.viewerContainer,
      this.onScrollUpdate.bind(this),
      this.signal,
    )
  }

  reset() {
    this._scrollMode = ScrollMode.VERTICAL
    this.previousScrollMode = ScrollMode.UNKNOWN
    this.scrollModePageState = {
      previousPageNumber: 1,
      scrollDown: true,
      pages: [],
    }

    this.updateScrollMode()
  }

  ensurePageVisible() {
    if (this.scrollMode !== ScrollMode.PAGE) {
      throw new Error('#ensurePageVisible: Invalid scrollMode value.')
    }

    this.viewerContainer.textContent = ''
    this.scrollModePageState.pages.length = 0

    if (this.spreadMode === SpreadMode.NONE && !this.isInPresentationMode) {
      const page = this.pages[this.currentPageNumber - 1]
      this.viewerContainer.append(page.div)

      this.scrollModePageState.pages.push(page)
    } else {
      const pageIndexSet = new Set<number>(),
        parity = this.spreadMode - 1

      if (parity === -1) {
        pageIndexSet.add(this.currentPageNumber - 1)
      } else if (this.currentPageNumber % 2 !== parity) {
        pageIndexSet.add(this.currentPageNumber - 1)
        pageIndexSet.add(this.currentPageNumber)
      } else {
        pageIndexSet.add(this.currentPageNumber - 2)
        pageIndexSet.add(this.currentPageNumber - 1)
      }

      const spread = createElement('div', 'spread')

      if (this.isInPresentationMode) {
        spread.append(createElement('div', 'page-dummy'))
      }

      for (const i of pageIndexSet) {
        const page = this.pages[i]
        if (!page) {
          continue
        }
        spread.append(page.div)

        this.scrollModePageState.pages.push(page)
      }

      this.viewerContainer.append(spread)
    }

    this.scrollModePageState.scrollDown = this.currentPageNumber >= this.scrollModePageState.previousPageNumber
    this.scrollModePageState.previousPageNumber = this.currentPageNumber
  }

  getVisiblePages() {
    const pages = this.scrollMode === ScrollMode.PAGE ? this.scrollModePageState.pages : this.pages
    const horizontal = this.scrollMode === ScrollMode.HORIZONTAL
    const rtl = horizontal && this.containerManager.isContainerRtl

    return getVisibleElements(this.viewerContainer, pages, true, horizontal, rtl)
  }

  private onScrollUpdate() {
    if (!this.pagesCount) return

    this.viewer.update()
  }

  scrollIntoView(page: Page, pageSpot?: { top: number, left: number }) {
    if (this.currentPageNumber !== page.id) {
      this.pagesManager.setCurrentPageNumber(page.id)
    }

    if (this.scrollMode === ScrollMode.PAGE) {
      this.ensurePageVisible()
      this.viewer.update()
    }

    if (!pageSpot && !this.isInPresentationMode) {
      const left = page.div.offsetLeft/* + page.div.clientLeft */
      const right = left + page.div.clientWidth

      if (this.scrollMode === ScrollMode.HORIZONTAL
        || left < this.viewerContainer.scrollLeft
        || right > this.viewerContainer.scrollLeft + this.viewerContainer.clientWidth
      ) {
        pageSpot = {
          left: 0,
          top: 0,
        }
      }
    }

    scrollIntoView(page.div, pageSpot)

    if (!this.currentScaleValue && this.location) {
      this.locationManager.reset()
    }
  }

  scrollPageIntoView({
    pageNumber,
    destination = undefined,
    allowNegativeOffset = false,
    ignoreDestinationZoom = false,
  }: {
    pageNumber: number
    destination?: ScrollDestination
    allowNegativeOffset?: boolean
    ignoreDestinationZoom?: boolean
  }) {
    if (!this.pdfDocument) return

    const page = Number.isInteger(pageNumber) && this.pages[pageNumber - 1]

    if (!page) {
      this.logger.error(`scrollPageIntoView: '${pageNumber}' is not a valid pageNumber parameter.`)
      return
    }

    if (this.isInPresentationMode || !destination) {
      this.pagesManager.setCurrentPageNumber(pageNumber, true)
      return
    }

    let x: number | undefined = 0
    let y: number | undefined = 0
    let width = 0
    let height = 0
    let widthScale
    let heightScale

    const changeOrientation = page.rotation % 180 !== 0
    const pageWidth = (changeOrientation ? page.height : page.width) / page.scale / PixelsPerInch.PDF_TO_CSS_UNITS
    const pageHeight = (changeOrientation ? page.width : page.height) / page.scale / PixelsPerInch.PDF_TO_CSS_UNITS

    let scale: string | number | undefined = undefined

    switch (destination[0]) {
      case 'XYZ':
        x = destination[1]
        y = destination[2]
        scale = destination[3]
        x = x !== null ? x : 0
        y = y !== null ? y : pageHeight
        break

      case 'Fit':
      case 'FitB':
        scale = 'page-fit'
        break

      case 'FitH':
      case 'FitBH':
        y = destination[1]
        scale = 'page-width'
        if (y === null && this.location) {
          x = this.location.left
          y = this.location.top
        } else if (typeof y !== 'number' || y < 0) {
          y = pageHeight
        }
        break

      case 'FitV':
      case 'FitBV':
        x = destination[1]
        width = pageWidth
        height = pageHeight
        scale = 'page-height'
        break

      case 'FitR': {
        x = destination[1]
        y = destination[2]
        width = destination[3] - x
        height = destination[4] - y

        let hPadding = SCROLLBAR_PADDING
        let vPadding = VERTICAL_PADDING

        if (this.options.removePageBorders) {
          hPadding = vPadding = 0
        }

        widthScale = (this.viewerContainer.clientWidth - hPadding) / width / PixelsPerInch.PDF_TO_CSS_UNITS
        heightScale = (this.viewerContainer.clientHeight - vPadding) / height / PixelsPerInch.PDF_TO_CSS_UNITS
        scale = Math.min(Math.abs(widthScale), Math.abs(heightScale))
        break
      }

      default:
        this.logger.error(`scrollPageIntoView: '${destination[0]}' is not a valid destination type.`)
        return
    }

    if (!ignoreDestinationZoom && scale && scale !== this.currentScale) {
      this.scaleManager.setScale(scale)
    }

    if (scale === 'page-fit' && !destination[4]) {
      this.scrollIntoView(page)
      return
    }

    const boundingRect = [page.viewport.convertToViewportPoint(x, y), page.viewport.convertToViewportPoint(x + width, y + height)]
    let left = Math.min(boundingRect[0][0], boundingRect[1][0])
    let top = Math.min(boundingRect[0][1], boundingRect[1][1])

    if (!allowNegativeOffset) {
      left = Math.max(left, 0)
      top = Math.max(top, 0)
    }

    this.scrollIntoView(page, { left, top })
  }

  get isHorizontalScrollbarEnabled() {
    return this.isInPresentationMode ? false : this.viewerContainer.scrollWidth > this.viewerContainer.clientWidth
  }

  get isVerticalScrollbarEnabled() {
    return this.isInPresentationMode ? false : this.viewerContainer.scrollHeight > this.viewerContainer.clientHeight
  }

  getScrollAhead(visible: VisibleElements) {
    if (visible.first?.id === 1) {
      return true
    } else if (visible.last?.id === this.pagesCount) {
      return false
    }

    switch (this.scrollMode) {
      case ScrollMode.PAGE:
        return this.scrollModePageState.scrollDown
      case ScrollMode.HORIZONTAL:
        return this.scroll.right
    }

    return this.scroll.down
  }

  get scrollMode() {
    return this._scrollMode
  }

  set scrollMode(mode: ScrollMode) {
    if (this.scrollMode === mode) {
      return
    }

    if (!isValidScrollMode(mode)) {
      throw new Error(`Invalid scroll mode: ${mode}`)
    }

    if (this.pagesCount > FORCE_SCROLL_MODE_PAGE) {
      return
    }

    this.previousScrollMode = this.scrollMode
    this._scrollMode = mode

    this.dispatch('scrollmodechanged', { mode })
    this.updateScrollMode(this.currentPageNumber)
  }

  private updateScrollMode(pageNumber?: number) {
    this.viewerContainer.classList.toggle('scroll-horizontal', this.scrollMode === ScrollMode.HORIZONTAL)
    this.viewerContainer.classList.toggle('scroll-wrapped', this.scrollMode === ScrollMode.WRAPPED)

    if (!this.pdfDocument || !pageNumber) {
      return
    }

    if (this.scrollMode === ScrollMode.PAGE) {
      this.ensurePageVisible()
    } else if (this.previousScrollMode === ScrollMode.PAGE) {
      this.spreadManager.updateSpreadMode()
    }

    if (this.currentScaleValue && isNaN(parseFloat(this.currentScaleValue))) {
      this.scaleManager.setScale(this.currentScaleValue, { noScroll: true })
    }

    this.pagesManager.setCurrentPageNumber(pageNumber, true)
    this.viewer.update()
  }
}
