import { Plugin } from '../plugin'
import { WatermarkLayerBuilder } from './watermark-layer-builder'

export type WatermarkPluginParams = {
  image: string
}

export class WatermarkPlugin extends Plugin<WatermarkPluginParams> {
  protected getLayerBuilders() {
    return this.params?.image ? [new WatermarkLayerBuilder(this.params)] : []
  }
}
