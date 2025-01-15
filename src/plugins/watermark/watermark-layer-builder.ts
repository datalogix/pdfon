import { createElement } from '@/utils'
import { LayerBuilder } from '@/viewer'
import type { WatermarkPlugin } from './watermark-plugin'

export class WatermarkLayerBuilder extends LayerBuilder {
  get image() {
    return this.layerProperties.getLayerProperty<WatermarkPlugin>('WatermarkPlugin')?.params?.image
  }

  canRegister() {
    return false
  }

  init() {
    const { canvasWrapper } = this.canvasPage

    if (!this.image || !canvasWrapper || canvasWrapper.querySelector('.watermark')) {
      return
    }

    const div = createElement('div', 'watermark')
    div.style.backgroundImage = `url('${this.image}')`
    canvasWrapper.appendChild(div)
  }
}
