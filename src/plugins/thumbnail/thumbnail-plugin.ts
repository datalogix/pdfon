import { Plugin } from '../plugin'
import { ThumbnailLayerBuilder } from './thumbnail-layer-builder'

export class ThumbnailPlugin extends Plugin {
  protected init() {
    this.viewer.addLayerBuilder(ThumbnailLayerBuilder)
  }

  protected destroy() {
    this.viewer.removeLayerBuilder(ThumbnailLayerBuilder)
  }
}
