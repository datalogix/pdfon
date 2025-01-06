import { PixelsPerInch } from '@/pdfjs'
import * as constants from '@/config'
import { SpreadMode, ScrollMode } from '@/enums'
import { isPortraitOrientation } from '@/utils'
import { PageUpdate } from '../page'
import type { ScrollDestination } from './scroll-manager'
import { Manager } from './'

export type ScaleUpdate = {
  scaleFactor?: number
  steps?: number
  drawingDelay?: number
  origin?: number[]
}

export type ScaleOptions = {
  noScroll?: boolean
  preset?: boolean
  drawingDelay?: number
  origin?: number[]
}

export class ScaleManager extends Manager {
  private _currentScale!: number
  private _currentScaleValue!: string
  private scaleTimeoutId?: NodeJS.Timeout
  private zoomDelay = constants.ZOOM_DELAY

  reset() {
    this._currentScale = constants.DEFAULT_SCALE
    this._currentScaleValue = constants.DEFAULT_SCALE_VALUE
  }

  updateZoom(options: ScaleUpdate = {}) {
    if (this.isInPresentationMode) {
      return
    }

    this.updateScale({
      drawingDelay: this.zoomDelay,
      ...options,
    })
  }

  zoomIn() {
    this.updateZoom({ steps: 1 })
  }

  zoomOut() {
    this.updateZoom({ steps: -1 })
  }

  get currentScale() {
    return this._currentScale
  }

  set currentScale(val) {
    if (isNaN(val)) {
      throw new Error('Invalid numeric scale.')
    }

    if (!this.pdfDocument) {
      return
    }

    this.setScale(val, { noScroll: false })
  }

  get currentScaleValue() {
    return this._currentScaleValue
  }

  set currentScaleValue(val) {
    if (!this.pdfDocument) {
      return
    }

    this.setScale(val!, { noScroll: false })
  }

  private isSameScale(newScale: number) {
    return newScale === this.currentScale || Math.abs(newScale - this.currentScale) < 1e-15
  }

  private setScaleUpdatePages(newScale: number, newValue: string | number, options?: ScaleOptions) {
    this._currentScaleValue = newValue.toString()

    if (this.isSameScale(newScale)) {
      if (options?.preset) {
        this.dispatch('scalechanging', {
          scale: newScale,
          presetValue: newValue,
        })

        this.viewer.update()
      }

      return
    }

    this.containerManager.setScaleFactor(newScale * PixelsPerInch.PDF_TO_CSS_UNITS)

    const drawingDelay = options?.drawingDelay ?? -1
    const postponeDrawing = drawingDelay >= 0 && drawingDelay < 1000

    this.viewer.refresh(true, {
      scale: newScale,
      drawingDelay: postponeDrawing ? drawingDelay : -1,
    })

    if (postponeDrawing) {
      this.scaleTimeoutId = setTimeout(() => {
        this.scaleTimeoutId = undefined
        this.viewer.refresh()
      }, drawingDelay)
    }

    const previousScale = this.currentScale
    this._currentScale = newScale

    if (!options?.noScroll) {
      let page = this.currentPageNumber
      let dest: ScrollDestination

      if (this.location && !(this.isInPresentationMode || this.isChangingPresentationMode)) {
        page = this.location.pageNumber
        dest = ['XYZ', this.location.left, this.location.top, undefined]
      }

      this.scrollManager.scrollPageIntoView({
        pageNumber: page,
        destination: dest,
        allowNegativeOffset: true,
      })

      if (Array.isArray(options?.origin)) {
        const scaleDiff = newScale / previousScale - 1
        this.viewerContainer.scrollLeft += options.origin[0] * scaleDiff
        this.viewerContainer.scrollTop += options.origin[1] * scaleDiff
      }
    }

    this.dispatch('scalechanging', {
      scale: newScale,
      presetValue: options?.preset ? newValue : undefined,
    })

    this.viewer.update()
  }

  private get pageWidthScaleFactor() {
    if (this.spreadMode !== SpreadMode.NONE && this.scrollMode !== ScrollMode.HORIZONTAL) {
      return 2
    }

    return 1
  }

  setScale(value: string | number, options?: ScaleOptions) {
    let scale = parseFloat(value.toString())

    if (scale > 0) {
      this.setScaleUpdatePages(scale, value, options)
      return
    }

    const currentPage = this.pages[this.currentPageNumber - 1]

    if (!currentPage) {
      return
    }

    let hPadding = constants.SCROLLBAR_PADDING
    let vPadding = constants.VERTICAL_PADDING

    if (this.isInPresentationMode) {
      hPadding = vPadding = 4
      if (this.spreadMode !== SpreadMode.NONE) {
        hPadding *= 2
      }
    } else if (this.options.removePageBorders) {
      hPadding = vPadding = 0
    } else if (this.scrollMode === ScrollMode.HORIZONTAL) {
      [hPadding, vPadding] = [vPadding, hPadding]
    }

    const pageWidthScale = (((this.viewerContainer.clientWidth - hPadding) / currentPage.width) * currentPage.scale) / this.pageWidthScaleFactor
    const pageHeightScale = ((this.viewerContainer.clientHeight - vPadding) / currentPage.height) * currentPage.scale

    switch (value) {
      case 'page-actual':
        scale = 1
        break
      case 'page-width':
        scale = pageWidthScale
        break
      case 'page-height':
        scale = pageHeightScale
        break
      case 'page-fit':
        scale = Math.min(pageWidthScale, pageHeightScale)
        break
      case 'auto': {
        const horizontalScale = isPortraitOrientation(currentPage) ? pageWidthScale : Math.min(pageHeightScale, pageWidthScale)
        scale = Math.min(constants.MAX_AUTO_SCALE, horizontalScale)
        break
      }
      default:
        this.logger.error(`setScale: '${value}' is an unknown zoom value.`)
        return
    }

    this.setScaleUpdatePages(scale, value, { ...options, preset: true })
  }

  updateScale(options: ScaleUpdate) {
    if (options.steps === undefined && options.scaleFactor === undefined) {
      throw new Error('Invalid updateScale options: either `steps` or `scaleFactor` must be provided.')
    }

    if (!this.pdfDocument) {
      return
    }

    let newScale = this.currentScale

    if (options.scaleFactor && options.scaleFactor > 0 && options.scaleFactor !== 1) {
      newScale = Math.round(newScale * options.scaleFactor * 100) / 100
    } else if (options.steps) {
      const delta = options.steps > 0 ? constants.DEFAULT_SCALE_DELTA : 1 / constants.DEFAULT_SCALE_DELTA
      const round = options.steps > 0 ? Math.ceil : Math.floor
      options.steps = Math.abs(options.steps)

      do {
        newScale = round(newScale * delta * 10) / 10
      } while (--options.steps > 0)
    }

    newScale = Math.max(constants.MIN_SCALE, Math.min(constants.MAX_SCALE, newScale))

    this.setScale(newScale, {
      noScroll: false,
      drawingDelay: options.drawingDelay,
      origin: options.origin,
    })
  }

  increaseScale(options: ScaleUpdate = {}) {
    this.updateScale({
      ...options,
      steps: options.steps ?? 1,
    })
  }

  decreaseScale(options: ScaleUpdate = {}) {
    this.updateScale({
      ...options,
      steps: -(options.steps ?? 1),
    })
  }

  refresh(_params: PageUpdate) {
    if (this.scaleTimeoutId) {
      clearTimeout(this.scaleTimeoutId)
      this.scaleTimeoutId = undefined
    }
  }
}
