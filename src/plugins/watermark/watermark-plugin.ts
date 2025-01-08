import { Plugin } from '../plugin'
import { WatermarkLayerBuilder } from './watermark-layer-builder'

export type WatermarkPluginParams = {
  image: string
}

export class WatermarkPlugin extends Plugin<WatermarkPluginParams> {
  protected init() {
    this.viewer.addLayerBuilder(WatermarkLayerBuilder)
  }

  protected destroy() {
    this.viewer.removeLayerBuilder(WatermarkLayerBuilder)
  }
}
