import { MAX_CANVAS_PIXELS } from '@/config'
import { OutputScale, type PageViewport } from '@/pdfjs'
import { createElement, approximateFraction, floorToDivide } from '@/utils'
import type { Page } from './page'

export class CanvasPage {
  private _canvasWrapper?: HTMLDivElement
  private _canvas?: HTMLCanvasElement
  private prevCanvas?: HTMLCanvasElement
  private hasRestrictedScaling = false
  private outputScale?: { sx: number, sy: number }
  private scaleRoundX = 1
  private scaleRoundY = 1
  private hidden?: boolean
  private _originalViewport?: PageViewport

  constructor(
    private readonly page: Page,
    private readonly maxCanvasPixels = MAX_CANVAS_PIXELS,
  ) {}

  get canvasWrapper() {
    return this._canvasWrapper
  }

  get canvas() {
    return this._canvas
  }

  get originalViewport() {
    return this._originalViewport
  }

  render() {
    // Wrap the canvas so that if it has a CSS transform for high DPI the
    // overflow will be hidden in Firefox.
    let canvasWrapper = this._canvasWrapper
    if (!canvasWrapper) {
      canvasWrapper = this._canvasWrapper = createElement('div', 'canvasWrapper')
      this.page.layersPage.add(canvasWrapper, 0)
    }

    const canvas = document.createElement('canvas')
    canvas.setAttribute('role', 'presentation')

    this.prevCanvas = this._canvas
    this._canvas = canvas
    this._originalViewport = this.page.viewport
    this.hidden = false

    const { width, height } = this.page.viewport
    const outputScale = this.outputScale = new OutputScale()

    if (this.maxCanvasPixels === 0) {
      const invScale = 1 / this.page.scale
      // Use a scale that makes the canvas have the originally intended size
      // of the page.
      outputScale.sx *= invScale
      outputScale.sy *= invScale
      this.hasRestrictedScaling = true
    } else if (this.maxCanvasPixels > 0) {
      const pixelsInViewport = width * height
      const maxScale = Math.sqrt(this.maxCanvasPixels / pixelsInViewport)

      if (outputScale.sx > maxScale || outputScale.sy > maxScale) {
        outputScale.sx = maxScale
        outputScale.sy = maxScale
        this.hasRestrictedScaling = true
      } else {
        this.hasRestrictedScaling = false
      }
    }

    const sfx = approximateFraction(outputScale.sx)
    const sfy = approximateFraction(outputScale.sy)

    const canvasWidth = (this._canvas.width = floorToDivide(Math.fround(width * outputScale.sx), sfx[0]))
    const canvasHeight = (this._canvas.height = floorToDivide(Math.fround(height * outputScale.sy), sfy[0]))
    const pageWidth = floorToDivide(Math.fround(width), sfx[1])
    const pageHeight = floorToDivide(Math.fround(height), sfy[1])
    outputScale.sx = canvasWidth / pageWidth
    outputScale.sy = canvasHeight / pageHeight

    if (this.scaleRoundX !== sfx[1]) {
      this.page.div.style.setProperty('--scale-round-x', `${sfx[1]}px`)
      this.scaleRoundX = sfx[1]
    }
    if (this.scaleRoundY !== sfy[1]) {
      this.page.div.style.setProperty('--scale-round-y', `${sfy[1]}px`)
      this.scaleRoundY = sfy[1]
    }

    return outputScale.scaled
      ? [outputScale.sx, 0, 0, outputScale.sy, 0, 0]
      : undefined
  }

  isOnlyCssZoom(viewport: PageViewport) {
    if (!this.hasRestrictedScaling) {
      return false
    }

    if (this.maxCanvasPixels === 0) {
      return true
    }

    if (this.maxCanvasPixels > 0) {
      return (Math.floor(viewport.width) * this.outputScale!.sx | 0)
        * (Math.floor(viewport.height) * this.outputScale!.sy | 0) > this.maxCanvasPixels
    }

    return false
  }

  get ctx() {
    return this._canvas?.getContext('2d', {
      alpha: false,
      willReadFrequently: !this.page.options.enableHWA,
    })
  }

  show(isLastShow?: boolean) {
    if (this.hidden || !this._canvasWrapper || !this._canvas) {
      return
    }

    const hasHCM = !!(this.page.options.pageColors?.background && this.page.options.pageColors?.foreground)

    if (!this.prevCanvas && !hasHCM) {
      // Don't add the canvas until the first draw callback, or until
      // drawing is complete when `!this.renderingQueue`, to prevent black
      // flickering.
      // In whatever case, the canvas must be the first child.
      this._canvasWrapper.prepend(this._canvas)
      this.hidden = true
      return
    }

    if (!isLastShow) {
      return
    }

    if (this.prevCanvas) {
      this.prevCanvas.replaceWith(this._canvas)
      this.prevCanvas.width = this.prevCanvas.height = 0
    } else {
      this._canvasWrapper.prepend(this._canvas)
    }

    this.hidden = true
  }

  reset() {
    this.prevCanvas?.remove()
    this.destroy()
  }

  destroy(destroyWrapper?: boolean) {
    if (destroyWrapper) this._canvasWrapper = undefined
    if (!this._canvas) return

    this._canvas.remove()
    this._canvas.width = this._canvas.height = 0
    this._canvas = undefined
    this._originalViewport = undefined
  }
}
