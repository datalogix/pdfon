import { Plugin } from '../plugin'
import { WatermarkLayerBuilder } from './watermark-layer-builder'

export type WatermarkPluginParams = {
  image: string
}

export class WatermarkPlugin extends Plugin<WatermarkPluginParams> {
  protected async getLayerBuilders() {
    const image = await this.params?.image

    return image
      ? [new WatermarkLayerBuilder({ image })]
      : []
  }
}
