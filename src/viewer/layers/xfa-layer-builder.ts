import { XfaLayer, XfaLayerParameters } from '@/pdfjs'
import { createElement } from '@/utils'
import { LayerBuilder } from './layer-builder'

export class XfaLayerBuilder extends LayerBuilder {
  canRegister() {
    return !!this.pdfPage?.isPureXfa
  }

  async render(_postponeDrawing?: boolean) {
    const xfaHtml = await this.pdfPage?.getXfa()

    if (this.cancelled || !xfaHtml) {
      return await this.buildXfaTextContentItems([])
    }

    if (this.div) {
      return XfaLayer.update({
        div: this.div,
        viewport: this.viewport.clone({ dontFlip: true }),
      } as XfaLayerParameters)
    }

    const { textDivs } = XfaLayer.render({
      div: this.div = createElement('div', 'xfaLayer'),
      viewport: this.viewport.clone({ dontFlip: true }),
      xfaHtml,
      annotationStorage: this.pdfDocument?.annotationStorage,
    } as XfaLayerParameters)

    await this.buildXfaTextContentItems(textDivs)
  }

  private async buildXfaTextContentItems(textDivs: Text[]) {
    const text = await this.pdfPage?.getTextContent()

    if (!text) {
      return
    }

    const items = []
    for (const item of text.items) {
      if ('str' in item) {
        items.push(item.str)
      }
    }

    this.dispatch('render', { textDivs, items })

    if (this.div) {
      this.layersPage.add(this.div, 3)
    }
  }
}
