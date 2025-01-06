import { RenderingCancelledException, type OptionalContentConfig, type RenderTask, type PDFPageProxy } from '@/pdfjs'
import { applyHighlightHCMFilter, updateLayerDimensions } from '@/utils'
import { AnnotationLayerBuilder } from '../layers'
import { RenderView } from '../rendering'
import { CanvasPage } from './canvas-page'
import { LayersPage } from './layers-page'
import type { PageUpdate, PageOptions } from './types'

export class Page extends RenderView {
  private previousRotation?: number
  private optionalContentConfigPromise?: Promise<OptionalContentConfig>
  private pageLabel?: string
  private isEditing = false

  readonly annotationCanvasMap?: Map<string, HTMLCanvasElement>
  readonly canvasPage
  readonly layersPage

  constructor(readonly options: PageOptions) {
    super(options)

    this.canvasPage = new CanvasPage(this, this.options.maxCanvasPixels)
    this.layersPage = new LayersPage(this, this.options.layerBuilders)

    this.div.setAttribute('role', 'region')
    this.div.setAttribute('aria-label', this.options.l10n.get('page.title', { page: this.id }))
    this.options.container?.append(this.div)

    if (this.options.isStandalone) {
      this.updateOptionalContentConfigPromise(this.options.optionalContentConfigPromise)
    }
  }

  get width() {
    return this.viewport.width
  }

  get height() {
    return this.viewport.height
  }

  get canvas() {
    return this.canvasPage.canvas
  }

  setPdfPage(pdfPage: PDFPageProxy) {
    if (this.options.isStandalone) {
      applyHighlightHCMFilter(this.div, this.options.pageColors, pdfPage.filterFactory)
    }

    super.setPdfPage(pdfPage)
  }

  protected updateDimensions() {
    if (this.options.isStandalone) {
      this.options.container?.style.setProperty('--scale-factor', this.viewport.scale.toString())
    }

    if (this.pdfPage) {
      if (this.previousRotation === this.viewport.rotation) {
        return
      }

      this.previousRotation = this.viewport.rotation
    }

    updateLayerDimensions(this.div, this.viewport, true, false)
  }

  reset(keepLayer?: boolean) {
    this.cancelRendering(keepLayer)
    super.reset()
    this.layersPage.reset(keepLayer)
  }

  hasEditableAnnotations() {
    return !!this.layersPage.find<AnnotationLayerBuilder>(AnnotationLayerBuilder)?.hasEditableAnnotations()
  }

  toggleEditingMode(isEditing: boolean) {
    if (!this.hasEditableAnnotations()) return

    this.isEditing = isEditing

    this.reset(true)
  }

  private updateOptionalContentConfigPromise(optionalContentConfigPromise?: Promise<OptionalContentConfig>) {
    this.optionalContentConfigPromise = optionalContentConfigPromise

    optionalContentConfigPromise?.then((optionalContentConfig) => {
      if (optionalContentConfigPromise !== this.optionalContentConfigPromise) {
        return
      }

      this.layersPage.updateOptionalContentConfig(optionalContentConfig)
    })
  }

  update(params: PageUpdate) {
    this._scale = params.scale || this.scale

    if (typeof params.rotation === 'number') {
      this._rotation = params.rotation
    }

    this.updateOptionalContentConfigPromise(params.optionalContentConfigPromise)
    this.setViewport(undefined, true)
    this.updateDimensions()

    this.layersPage.process(params)

    if (!this.process(params)) {
      return
    }

    this.layersPage.update(params)
    this.reset(true)
  }

  private process({ drawingDelay = -1 }: PageUpdate) {
    if (!this.canvas) {
      return true
    }

    const onlyCssZoom = this.canvasPage.isOnlyCssZoom(this.viewport)
    const postponeDrawing = drawingDelay >= 0 && drawingDelay < 1000

    if (!(postponeDrawing || onlyCssZoom)) {
      return true
    }

    if (postponeDrawing && !onlyCssZoom && !this.isRenderingFinished) {
      this.cancelRendering(true, drawingDelay)
      this.markAsRenderingFinished(false)
    }

    this.layersPage.render(postponeDrawing)

    if (!postponeDrawing) {
      this.markAsRenderingFinished()
    }

    return false
  }

  cancelRendering(keepLayer?: boolean, cancelExtraDelay?: number) {
    super.cancel(cancelExtraDelay)

    this.layersPage.cancel(keepLayer)
  }

  getPagePoint(x: number, y: number) {
    return this.viewport.convertToPdfPoint(x, y)
  }

  protected async render() {
    const transform = this.canvasPage.render()

    await this.layersPage.init()
    this.canvasPage.show(false)

    return this.pdfPage!.render({
      canvasContext: this.canvasPage.ctx!,
      transform,
      viewport: this.viewport,
      annotationMode: this.options.annotationMode,
      optionalContentConfigPromise: this.optionalContentConfigPromise,
      annotationCanvasMap: this.annotationCanvasMap,
      pageColors: this.options.pageColors,
      isEditing: this.isEditing,
    })
  }

  protected async finishRenderTask(renderTask: RenderTask, error?: any) {
    if (!error || !(error instanceof RenderingCancelledException)) {
      this.canvasPage.show(true)
    }

    error = await super.finishRenderTask(renderTask, error)

    if (error instanceof RenderingCancelledException) {
      return
    }

    this.layersPage.finish(renderTask)

    if (error) {
      throw error
    }

    await this.layersPage.render()
  }

  setPageLabel(label?: string) {
    this.pageLabel = typeof label === 'string' ? label : undefined
    this.div.setAttribute('aria-label', this.options.l10n.get('page.title', { page: this.pageLabel ?? this.id }))

    if (this.pageLabel !== undefined) {
      this.div.setAttribute('data-page-label', this.pageLabel)
    } else {
      this.div.removeAttribute('data-page-label')
    }
  }
}
