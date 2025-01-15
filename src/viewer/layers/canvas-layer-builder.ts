import { LayerBuilder } from './layer-builder'

export class CanvasLayerBuilder extends LayerBuilder {
  canKeep(keep = true) {
    return keep && this.canvasPage.canvasWrapper
  }

  canCancel(_keep = true) {
    return false
  }

  hide(keep?: boolean) {
    if (!keep && this.canvasPage.canvasWrapper) {
      this.canvasPage.destroy(true)
    }
  }

  update() {
    if (!this.canvas || !this.canvasPage.originalViewport || this.viewport === this.canvasPage.originalViewport) {
      return
    }

    const relativeRotation = (360 + this.viewport.rotation - this.canvasPage.originalViewport.rotation) % 360
    if (relativeRotation === 90 || relativeRotation === 270) {
      const { width, height } = this.viewport
      this.canvas.style.transform = `rotate(${relativeRotation}deg) scale(${height / width},${width / height})`
    } else {
      this.canvas.style.transform = relativeRotation === 0 ? '' : `rotate(${relativeRotation}deg)`
    }
  }
}
