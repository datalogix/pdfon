import type { OptionalContentConfig, RenderTask } from '@/pdfjs'
import { LayerBuilder } from '@/viewer'

export class ThumbnailLayerBuilder extends LayerBuilder {
  private useThumbnailCanvas = {
    directDrawing: true,
    initialOptionalContent: true,
    regularAnnotations: true,
  }

  get thumbnailCanvas() {
    return this.useThumbnailCanvas.directDrawing
      && this.useThumbnailCanvas.initialOptionalContent
      && this.useThumbnailCanvas.regularAnnotations
      ? this.canvas
      : null
  }

  canCancel(_keep = true) {
    return false
  }

  updateOptionalContentConfig(optionalContentConfig: OptionalContentConfig) {
    this.useThumbnailCanvas.initialOptionalContent = optionalContentConfig.hasInitialVisibility
  }

  process() {
    this.useThumbnailCanvas.directDrawing = true
  }

  cancel() {
    this.useThumbnailCanvas.directDrawing = false
  }

  finish(renderTask: RenderTask) {
    this.useThumbnailCanvas.regularAnnotations = !renderTask.separateAnnots
  }
}
