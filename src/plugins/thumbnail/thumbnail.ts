import type { EventBus } from '@/bus'
import type { Translator } from '@/l10n'
import type { OptionalContentConfig, PageViewport } from '@/pdfjs'
import { createElement } from '@/utils'
import { type LayerPropertiesManager, type Page, type PageColors, type RenderingQueue, RenderView } from '@/viewer'
import { createScaledCanvasContext, reduceImage } from './helpers'
import type { ThumbnailLayerBuilder } from './thumbnail-layer-builder'

const DRAW_UPSCALE_FACTOR = 2
const MAX_NUM_SCALING_STEPS = 3
const THUMBNAIL_WIDTH = 120

export class Thumbnail extends RenderView {
  private readonly anchor = createElement('a')
  private readonly placeholderImg = createElement('div', 'thumbnail-image')
  private pageLabel?: string
  private image?: HTMLImageElement
  private canvas?: HTMLCanvasElement
  private canvasWidth = 0
  private canvasHeight = 0

  resume: (() => void) | null = null

  constructor(readonly options: {
    container: HTMLDivElement
    eventBus: EventBus
    translator: Translator
    layerProperties: LayerPropertiesManager
    id: number
    viewport: PageViewport
    scale?: number
    rotation?: number
    renderingQueue?: RenderingQueue
    optionalContentConfigPromise?: Promise<OptionalContentConfig>
    enableHWA?: boolean
    pageColors?: PageColors
  }) {
    super(options)

    this.anchor.setAttribute('title', options.translator.translate('title', { page: this.pageLabel ?? this.id }))
    this.anchor.setAttribute('href', options.layerProperties.locationManager.getAnchorUrl(`#page=${options.id}`))
    this.anchor.addEventListener('click', (e) => {
      e.preventDefault()
      options.layerProperties.pagesManager.currentPageNumber = options.id
      this.dispatch('ThumbnailClick', { pageNumber: options.id })
    })

    this.div.append(this.placeholderImg)
    this.anchor.append(this.div)
    options.container.append(this.anchor)
  }

  protected updateDimensions() {
    this.canvasWidth = THUMBNAIL_WIDTH
    this.canvasHeight = (this.canvasWidth / (this.viewport.width / this.viewport.height)) | 0
    this._scale = this.canvasWidth / this.viewport.width

    this.div.style.width = `${this.canvasWidth}px`
    this.div.style.height = `${this.canvasHeight}px`
  }

  protected setViewport(scale?: number, clone?: boolean) {
    super.setViewport(scale ?? 1, clone)
  }

  destroy() {
    this.cancelRendering()

    this.anchor.remove()
    this.placeholderImg.remove()
    this.image?.remove()
    this.image = undefined

    this.canvas?.remove()
    this.canvas = undefined
  }

  reset() {
    super.reset()

    this.image?.replaceWith(this.placeholderImg)
    this.updateDimensions()
    this.image?.removeAttribute('src')

    delete this.image
  }

  update({ rotation }: { rotation?: number }) {
    if (typeof rotation === 'number') {
      this._rotation = rotation
    }

    this.setViewport(1, true)
    this.reset()
  }

  private convertCanvasToImage(canvas: HTMLCanvasElement) {
    if (!this.isRenderingFinished) {
      throw new Error('convertCanvasToImage: Rendering has not finished.')
    }

    const { ctx, canvas: pageDrawCanvas } = createScaledCanvasContext(this.canvasWidth, this.canvasHeight, 1, true)
    const reducedCanvas = reduceImage(canvas, ctx, pageDrawCanvas, MAX_NUM_SCALING_STEPS)

    this.image = createElement('img', 'thumbnail-image', {
      'src': reducedCanvas.toDataURL(),
      'aria-label': this.options.translator.translate('image', { page: this.pageLabel ?? this.id }),
      'onload': () => this.markAsLoaded(),
    })

    this.placeholderImg.replaceWith(this.image)

    reducedCanvas.width = 0
    reducedCanvas.height = 0
  }

  markAsRenderingFinished(dispatchEvent = true) {
    super.markAsRenderingFinished(dispatchEvent)

    if (this.canvas) {
      this.convertCanvasToImage(this.canvas)
    }
  }

  protected async render() {
    const { ctx, canvas, transform } = createScaledCanvasContext(
      this.canvasWidth,
      this.canvasHeight,
      DRAW_UPSCALE_FACTOR,
      this.options.enableHWA,
    )

    this.canvas = canvas

    return this.pdfPage!.render({
      canvasContext: ctx!,
      transform,
      viewport: this.viewport.clone({ scale: DRAW_UPSCALE_FACTOR * this.scale }),
      optionalContentConfigPromise: this.options.optionalContentConfigPromise,
      pageColors: this.options.pageColors,
    })
  }

  setImage(page: Page) {
    if (!this.isRenderingInitial) {
      return
    }

    const canvas = page.layersPage.find<ThumbnailLayerBuilder>('ThumbnailLayerBuilder')?.thumbnailCanvas

    if (!canvas) {
      return
    }

    if (!this.pdfPage && page.pdfPage) {
      this.setPdfPage(page.pdfPage)
    }

    if (page.scale < this.scale) {
      return
    }

    this.markAsRenderingFinished(false)
    this.convertCanvasToImage(canvas)
  }

  setPageLabel(label?: string) {
    this.pageLabel = typeof label === 'string' ? label : undefined

    this.anchor.setAttribute(
      'title',
      this.options.translator.translate('title', { page: this.pageLabel ?? this.id }),
    )

    if (!this.isRenderingFinished) {
      return
    }

    this.image?.setAttribute(
      'aria-label',
      this.options.translator.translate('image', { page: this.pageLabel ?? this.id }),
    )
  }
}
