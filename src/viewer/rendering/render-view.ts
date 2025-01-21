import { Dispatcher, type EventBus } from '@/bus'
import { DEFAULT_SCALE } from '@/config'
import { RenderingStates } from '@/enums'
import * as pdfjs from '@/pdfjs'
import { createElement } from '@/utils'
import type { RenderingQueue } from './rendering-queue'

export abstract class RenderView extends Dispatcher implements pdfjs.IRenderableView {
  private _name?: string
  readonly div = createElement('div')

  private _pdfPage?: pdfjs.PDFPageProxy
  private pdfPageRotate
  protected _viewport: pdfjs.PageViewport
  protected _scale
  protected _rotation

  private loadingId?: NodeJS.Timeout
  private _renderingState = RenderingStates.INITIAL
  private renderTask?: pdfjs.RenderTask
  protected renderError?: any

  resume: (() => void) | null = null

  constructor(readonly options: {
    id: number
    eventBus: EventBus
    viewport: pdfjs.PageViewport
    scale?: number
    rotation?: number
    renderingQueue?: RenderingQueue
  }) {
    super()

    this._viewport = this.options.viewport
    this._scale = this.options.scale ?? DEFAULT_SCALE
    this._rotation = this.options.rotation ?? 0

    this.div.classList.add(this.name)
    this.div.setAttribute('data-page-number', this.id.toString())

    this.pdfPageRotate = this.viewport.rotation

    queueMicrotask(() => this.updateDimensions())
  }

  protected abstract updateDimensions(): void

  get id() {
    return this.options.id
  }

  get eventBus() {
    return this.options.eventBus
  }

  get name() {
    if (!this._name) {
      this._name = this.constructor.name.toLowerCase()
    }

    return this._name
  }

  get renderingId() {
    return `${this.name}${this.id}`
  }

  get renderingState() {
    return this._renderingState
  }

  set renderingState(state) {
    if (state === this.renderingState) return

    this._renderingState = state

    if (this.loadingId) {
      clearTimeout(this.loadingId)
      this.loadingId = undefined
    }

    switch (state) {
      case RenderingStates.PAUSED:
        this.div.classList.remove('loading')
        break
      case RenderingStates.RUNNING:
        this.div.classList.add('loading-icon')
        this.loadingId = setTimeout(() => {
          this.div.classList.add('loading')
          this.loadingId = undefined
        }, 0)
        break
      case RenderingStates.INITIAL:
      case RenderingStates.FINISHED:
        this.div.classList.remove('loading-icon', 'loading')
        break
      case RenderingStates.ERROR:
        this.div.classList.add('error')
        this.div.classList.remove('loading-icon', 'loading')
        break
    }
  }

  get isRenderingInitial() {
    return this.renderingState === RenderingStates.INITIAL
  }

  get isRenderingFinished() {
    return this.renderingState === RenderingStates.FINISHED
  }

  get pdfPage() {
    return this._pdfPage
  }

  get viewport() {
    return this._viewport
  }

  get scale() {
    return this._scale
  }

  get rotation() {
    return this._rotation
  }

  markAsRenderingFinished(dispatchEvent = true) {
    this.renderingState = RenderingStates.FINISHED

    if (!dispatchEvent) return

    this.dispatch(`${this.name}rendered`, {
      pageNumber: this.id,
      cssTransform: false,
      timestamp: performance.now(),
      error: this.renderError,
    })
  }

  protected setViewport(scale?: number, clone?: boolean) {
    const params = {
      scale: scale ?? this.scale * pdfjs.PixelsPerInch.PDF_TO_CSS_UNITS,
      rotation: (this.rotation + this.pdfPageRotate) % 360,
    }

    if (clone) {
      this._viewport = this.viewport.clone(params)
    } else if (this.pdfPage) {
      this._viewport = this.pdfPage.getViewport(params)
    }
  }

  setPdfPage(pdfPage: pdfjs.PDFPageProxy) {
    this._pdfPage = pdfPage
    this.pdfPageRotate = pdfPage.rotate

    this.setViewport()
    this.updateDimensions()
    this.reset()
  }

  destroy() {
    this.reset()
    this.pdfPage?.cleanup()
  }

  reset() {
    this.cancel()
    this.renderingState = RenderingStates.INITIAL
    this.div.removeAttribute('data-loaded')
  }

  cancelRendering() {
    this.cancel()
  }

  protected markAsLoaded() {
    this.div.setAttribute('data-loaded', 'true')
  }

  protected cancel(extraDelay = 0) {
    this.renderTask?.cancel(extraDelay)
    this.renderTask = undefined
    this.resume = null
  }

  protected abstract render(): Promise<pdfjs.RenderTask>

  async draw() {
    if (!this.isRenderingInitial) {
      this.reset()
    }

    if (!this.pdfPage) {
      this.renderingState = RenderingStates.FINISHED
      throw new Error('pdfPage is not loaded')
    }

    this.renderingState = RenderingStates.RUNNING

    try {
      const renderTask = this.renderTask = await this.render()

      renderTask.onContinue = (cont: () => void) => {
        if (this.options.renderingQueue?.isHighestPriority(this)) {
          return cont()
        }

        this.renderingState = RenderingStates.PAUSED

        this.resume = () => {
          this.renderingState = RenderingStates.RUNNING
          cont()
        }
      }

      const resultPromise = renderTask.promise.then(
        async () => await this.finishRenderTask(renderTask),
        async error => await this.finishRenderTask(renderTask, error),
      )

      return resultPromise.finally(() => {
        this.dispatch(`${this.name}render`, {
          pageNumber: this.id,
        })
      })
    } catch (ex) {
      this.renderingState = RenderingStates.ERROR

      throw ex
    }
  }

  protected async finishRenderTask(renderTask: pdfjs.RenderTask, error?: any) {
    if (renderTask === this.renderTask) {
      this.renderTask = undefined
    }

    if (error instanceof pdfjs.RenderingCancelledException) {
      this.renderError = null
      return
    }

    this.renderError = error
    this.markAsRenderingFinished()

    return error
  }
}
