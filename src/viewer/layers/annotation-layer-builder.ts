import { PresentationModeState } from '@/enums'
import { AnnotationLayer, AnnotationMode, type AnnotationLayerParameters } from '@/pdfjs'
import { DownloadPlugin, ScriptingPlugin } from '@/plugins'
import { LayerBuilder } from './layer-builder'
import { TextLayerBuilder } from './text-layer-builder'

export class AnnotationLayerBuilder extends LayerBuilder {
  private _annotationLayer?: AnnotationLayer

  get annotationLayer() {
    return this._annotationLayer
  }

  canRegister() {
    return this.options.annotationMode !== AnnotationMode.DISABLE
  }

  async render() {
    if (this.div) {
      if (this.cancelled || !this._annotationLayer) {
        return
      }

      this._annotationLayer.update({
        viewport: this.viewport.clone({ dontFlip: true }),
      } as AnnotationLayerParameters)

      return
    }

    if (this.cancelled) {
      return
    }

    const [annotations, hasJSActions, fieldObjects] = await Promise.all([
      this.pdfPage?.getAnnotations() || Promise.resolve([]),
      this.pdfDocument?.hasJSActions() || Promise.resolve(false),
      this.pdfDocument?.getFieldObjects() || Promise.resolve(null),
    ])

    const div = this.create('annotationLayer', 2)

    if (annotations.length === 0) {
      this.hide()
      return
    }

    this._annotationLayer = new AnnotationLayer({
      div,
      accessibilityManager: this.findLayer<TextLayerBuilder>(TextLayerBuilder)?.textAccessibilityManager,
      annotationCanvasMap: this.page.annotationCanvasMap,
      annotationEditorUIManager: this.layerProperties.annotationManager.annotationEditorUIManager,
      page: this.pdfPage,
      viewport: this.viewport.clone({ dontFlip: true }),
      structTreeLayer: undefined,
    })

    await this._annotationLayer.render({
      annotations,
      imageResourcesPath: this.options.imageResourcesPath,
      downloadManager: this.layerProperties.getLayerProperty<DownloadPlugin>('DownloadPlugin')?.downloadManager,
      renderForms: this.layerProperties.annotationManager.renderForms,
      annotationStorage: this.pdfDocument?.annotationStorage,
      enableScripting: !!this.layerProperties.getLayerProperty<ScriptingPlugin>('ScriptingPlugin')?.scriptingManager,
      hasJSActions,
      fieldObjects,
    } as AnnotationLayerParameters)

    if (this.layerProperties.presentationManager.isInPresentationMode) {
      this.updatePresentationModeState(PresentationModeState.FULLSCREEN)
    }

    if (!this.abortController) {
      this.abortController = new AbortController()
      this.on('presentationmodechanged', ({ state }) => this.updatePresentationModeState(state))
    }

    this.dispatch('render')
  }

  hasEditableAnnotations() {
    return !!this._annotationLayer?.hasEditableAnnotations()
  }

  private updatePresentationModeState(state: PresentationModeState) {
    this.div?.childNodes.forEach((section) => {
      if (!(section instanceof HTMLElement) || section.hasAttribute('data-internal-link')) {
        return
      }

      section.inert = PresentationModeState.FULLSCREEN === state
    })
  }
}
