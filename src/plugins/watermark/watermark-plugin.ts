import { Plugin } from '../plugin'
import { WatermarkLayerBuilder } from './watermark-layer-builder'

export type WatermarkPluginParams = {
  image: string
}

export class WatermarkPlugin extends Plugin<WatermarkPluginParams> {
  protected getLayerBuilders() {
    const image = this.resolvedParams?.image

    return image
      ? [new WatermarkLayerBuilder({ image })]
      : []
  }
}
