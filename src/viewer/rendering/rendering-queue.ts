import { RenderingStates } from '@/enums'
import { RenderingCancelledException, type IRenderableView } from '@/pdfjs'
import { VisibleElements } from '@/utils'

const CLEANUP_TIMEOUT = 30000
type Handler = () => boolean | undefined

export interface Renderable {
  forceRendering(currentlyVisible?: VisibleElements): boolean
}

export class RenderingQueue {
  private highestPriority?: string
  private idleTimeout?: NodeJS.Timeout
  private handlers: Handler[] = []
  private _printing = false

  constructor(
    private render: Renderable,
    private onIdle?: () => void,
  ) { }

  get printing() {
    return this._printing
  }

  startPrinting() {
    this._printing = true
  }

  stopPrinting() {
    this._printing = false
  }

  registerHandler(handler: Handler) {
    this.handlers.push(handler)
  }

  isHighestPriority(view: IRenderableView) {
    return this.highestPriority === view.renderingId
  }

  renderHighestPriority(currentlyVisible?: VisibleElements) {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout)
      this.idleTimeout = undefined
    }

    if (this.render.forceRendering(currentlyVisible)) {
      return
    }

    for (const handler of this.handlers) {
      if (handler()) {
        return
      }
    }

    if (this.printing) {
      return
    }

    if (this.onIdle) {
      this.idleTimeout = setTimeout(this.onIdle.bind(this), CLEANUP_TIMEOUT)
    }
  }

  getHighestPriority(
    visible: VisibleElements,
    views: IRenderableView[],
    scrolledDown: boolean,
    preRenderExtra = false,
  ) {
    if (!visible.views.length) {
      return null
    }

    for (let i = 0; i < visible.views.length; i++) {
      const view = visible.views[i].view

      if (!view.isRenderingFinished) {
        return view
      }
    }

    const firstId = visible.first!.id
    const lastId = visible.last!.id

    if (lastId - firstId + 1 > visible.views.length) {
      const visibleIds = visible.ids

      for (let i = 1, ii = lastId - firstId; i < ii; i++) {
        const holeId = scrolledDown ? firstId + i : lastId - i
        if (visibleIds.has(holeId)) {
          continue
        }

        const holeView = views[holeId - 1]

        if (!holeView.isRenderingFinished) {
          return holeView
        }
      }
    }

    let preRenderIndex = scrolledDown ? lastId : firstId - 2
    let preRenderView = views[preRenderIndex]

    if (preRenderView && !preRenderView.isRenderingFinished) {
      return preRenderView
    }

    if (preRenderExtra) {
      preRenderIndex += scrolledDown ? 1 : -1
      preRenderView = views[preRenderIndex]

      if (preRenderView && !preRenderView.isRenderingFinished) {
        return preRenderView
      }
    }

    return null
  }

  renderView(view: IRenderableView) {
    switch (view.renderingState) {
      case RenderingStates.ERROR:
      case RenderingStates.FINISHED:
        return false

      case RenderingStates.PAUSED:
        this.highestPriority = view.renderingId
        if (view.resume) view.resume()
        break

      case RenderingStates.RUNNING:
        this.highestPriority = view.renderingId
        break

      case RenderingStates.INITIAL:
        this.highestPriority = view.renderingId

        view.draw()
          .finally(() => this.renderHighestPriority())
          .catch((reason) => {
            if (reason instanceof RenderingCancelledException) {
              return
            }

            throw reason
          })
        break
    }

    return true
  }
}
