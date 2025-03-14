import { AnnotationEditorLayer, DrawLayer, type AnnotationEditorLayerOptions } from '@/pdfjs'
import { LayerBuilder, type AnnotationLayerBuilder, type StructTreeLayerBuilder, type TextLayerBuilder } from '@/viewer'

export class AnnotationEditorLayerBuilder extends LayerBuilder {
  private _annotationEditorLayer?: AnnotationEditorLayer
  private _drawLayer?: DrawLayer

  get annotationEditorLayer() {
    return this._annotationEditorLayer
  }

  get annotationEditorUIManager() {
    return this.layerProperties.annotationManager.annotationEditorUIManager
  }

  canRegister() {
    return !!this.annotationEditorUIManager
  }

  async render() {
    if (this.cancelled) {
      return
    }

    this._drawLayer ||= new DrawLayer({ pageIndex: this.id })
    this._drawLayer.setParent(this.canvasPage.canvasWrapper)

    const clonedViewport = this.viewport.clone({ dontFlip: true })

    if (this.div) {
      this._annotationEditorLayer?.update({ viewport: clonedViewport })
      this.updateLayerDimensions(clonedViewport)
      this.show()
      return
    }

    const div = this.create('annotationEditorLayer', 3)
    this.hide()
    div.dir = this.annotationEditorUIManager?.direction

    this._annotationEditorLayer = new AnnotationEditorLayer({
      div,
      uiManager: this.annotationEditorUIManager,
      structTreeLayer: this.findLayer<StructTreeLayerBuilder>('StructTreeLayerBuilder'),
      accessibilityManager: this.findLayer<TextLayerBuilder>('TextLayerBuilder')?.textAccessibilityManager,
      pageIndex: this.id - 1,
      annotationLayer: this.findLayer<AnnotationLayerBuilder>('AnnotationLayerBuilder')?.annotationLayer,
      textLayer: this.findLayer<TextLayerBuilder>('TextLayerBuilder'),
      drawLayer: this._drawLayer,
      viewport: clonedViewport,
      l10n: this.l10n as any,
    } as AnnotationEditorLayerOptions)

    this._annotationEditorLayer.render({
      viewport: clonedViewport,
    })

    this.show()
    this.dispatch('Render')
  }

  cancel() {
    super.cancel()

    if (!this.div) {
      return
    }

    this._drawLayer?.destroy()
    this._drawLayer = undefined

    this._annotationEditorLayer?.destroy()
    this._annotationEditorLayer = undefined
  }

  hide() {
    if (!this.div) return

    this.annotationEditorLayer?.pause(true)
    super.hide()
  }

  show() {
    if (!this.div || this._annotationEditorLayer?.isInvisible) {
      // return
    }

    super.show()
    this._annotationEditorLayer?.pause(false)
  }
}
