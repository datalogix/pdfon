import * as layers from '../layers'
import { Manager } from './'

export class LayerBuildersManager extends Manager {
  private builders = new Set<layers.LayerBuilderType>([
    layers.CanvasLayerBuilder,
    layers.TextLayerBuilder,
    layers.AnnotationLayerBuilder,
    layers.XfaLayerBuilder,
    layers.StructTreeLayerBuilder,
  ])

  addLayerBuilder(layerBuilder: layers.LayerBuilderType) {
    this.builders.add(layerBuilder)
  }

  removeLayerBuilder(layerBuilder: layers.LayerBuilderType) {
    this.builders.delete(layerBuilder)
  }

  layersToArray() {
    return Array.from(this.builders)
  }
}
