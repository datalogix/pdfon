import type { PageViewport, RenderTask } from '@/pdfjs'
import type { Page } from '../page'
import { LayerBuilder } from './layer-builder'

export class ZoomLayerBuilder extends LayerBuilder {
  private _viewportMap: WeakMap<HTMLCanvasElement, PageViewport> = new WeakMap()

  get viewportMap() {
    return this._viewportMap
  }

  setPage(page: Page) {
    super.setPage(page)

    if (this.canvas) {
      this._viewportMap.set(this.canvas, this.viewport)
    }
  }

  canKeep(keep = true) {
    return !super.canKeep(keep)
  }

  canCancel(_keep = true) {
    return false
  }

  hide() {
    if (this.canvas) {
      this._viewportMap.delete(this.canvas)
      this.canvasPage.destroy()
    }

    this.reset()
    this.dispatch('hide')
  }

  update() {
    if (!this.div && this.canvas && !this.canvas.hidden) {
      this.div = this.canvas.parentNode as HTMLDivElement
      this.div.style.position = 'absolute'
    }

    if (this.div) {
      this.render()
    }

    this.dispatch('update')
  }

  async render() {
    const viewport = this.viewport
    const target = (this.div ? this.div.firstChild : this.canvas) as HTMLCanvasElement | undefined

    if (!target) {
      return
    }

    if (!target.hasAttribute('zooming')) {
      target.setAttribute('zooming', 'true')
      target.style.width = target.style.height = ''
    }

    const originalViewport = this._viewportMap.get(target)

    if (originalViewport && viewport !== originalViewport) {
      const relativeRotation = viewport.rotation - originalViewport.rotation
      const absRotation = Math.abs(relativeRotation)

      let scaleX = 1
      let scaleY = 1

      if (absRotation === 90 || absRotation === 270) {
        scaleX = viewport.height / viewport.width
        scaleY = viewport.width / viewport.height
      }

      target.style.transform = `rotate(${relativeRotation}deg) scale(${scaleX}, ${scaleY})`
    }

    this.dispatch('render', { target, originalViewport })
  }

  finish(renderTask: RenderTask) {
    super.finish(renderTask)

    this.reset(true)
  }

  private reset(removeFromDOM?: boolean) {
    if (!this.div) return

    const element = this.div.firstChild as HTMLCanvasElement

    if (element) {
      this._viewportMap.delete(element)
      element.width = 0
      element.height = 0
    }

    if (removeFromDOM) {
      this.div.remove()
    }

    this.div = undefined
  }
}
