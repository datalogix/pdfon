import { createElement } from '@/utils'
import { LayerBuilder } from '@/viewer'

export class WatermarkLayerBuilder extends LayerBuilder<{ image: string }> {
  canRegister() {
    return false
  }

  init() {
    const { canvasWrapper } = this.canvasPage

    if (!this.params?.image || !canvasWrapper || canvasWrapper.querySelector('.watermark')) {
      return
    }

    const div = createElement('div', 'watermark')
    div.style.backgroundImage = `url('${this.params.image}')`
    canvasWrapper.appendChild(div)
  }
}
