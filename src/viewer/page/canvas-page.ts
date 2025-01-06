import type { PageViewport } from '@/pdfjs'
import { MAX_CANVAS_PIXELS } from '@/config'
import { createElement, approximateFraction, floorToDivide } from '@/utils'
import type { Page } from './page'

export class CanvasPage {
  private _canvasWrapper?: HTMLDivElement
  private _canvas?: HTMLCanvasElement
  private hasRestrictedScaling = false
  private outputScale?: { sx: number, sy: number }

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

  render() {
    const viewport = this.page.viewport
    this._canvasWrapper = createElement('div', 'canvasWrapper')
    this.page.layersPage.add(this._canvasWrapper, 0)

    this._canvas = createElement('canvas')
    this._canvas.setAttribute('role', 'presentation')
    this._canvas.hidden = true
    this._canvasWrapper.append(this._canvas)

    const outputScale = this.outputScale = {
      sx: window.devicePixelRatio || 1,
      sy: window.devicePixelRatio || 1,
    }

    if (this.maxCanvasPixels === 0) {
      const invScale = 1 / this.page.scale
      outputScale.sx *= invScale
      outputScale.sy *= invScale
      this.hasRestrictedScaling = true
    } else if (this.maxCanvasPixels > 0) {
      const pixelsInViewport = viewport.width * viewport.height
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

    this._canvas.width = floorToDivide(viewport.width * outputScale.sx, sfx[0])
    this._canvas.height = floorToDivide(viewport.height * outputScale.sy, sfy[0])
    this._canvas.style.width = floorToDivide(viewport.width, sfx[1]) + 'px'
    this._canvas.style.height = floorToDivide(viewport.height, sfy[1]) + 'px'

    return this.outputScale.sx !== 1 || this.outputScale.sy !== 1
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

  show(isLastShow: boolean) {
    if (!this._canvas?.hidden) return

    const { pageColors } = this.page.options
    const hasHCM = !!(pageColors?.background && pageColors?.foreground)

    if (!hasHCM || isLastShow) {
      this._canvas.hidden = false
    }
  }

  destroy() {
    if (!this._canvas) return

    this._canvas.width = 0
    this._canvas.height = 0

    this._canvasWrapper?.removeChild(this._canvas)

    delete this._canvas
  }
}
