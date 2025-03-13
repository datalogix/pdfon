import { Plugin, TourPlugin } from '@/plugins'
import { AnnotationLayerBuilder, StructTreeLayerBuilder, TextLayerBuilder, XfaLayerBuilder } from '@/viewer'
import { Pdfon } from './pdfon'
import { InteractionEditorLayerBuilder } from './InteractionEditorLayerBuilder'

export class TourEditorPlugin extends TourPlugin {
  protected resolveToolbarItems() {
    //
  }

  protected steps() {
    return [this.firstStep()]
  }
}

export class InteractionEditorPlugin extends Plugin {
  protected layerBuilders = [InteractionEditorLayerBuilder]
}

export class EditorPlugin extends Plugin {
  protected init() {
    this.viewer.removeLayerBuilder(TextLayerBuilder)
    this.viewer.removeLayerBuilder(AnnotationLayerBuilder)
    this.viewer.removeLayerBuilder(XfaLayerBuilder)
    this.viewer.removeLayerBuilder(StructTreeLayerBuilder)
  }

  protected destroy() {
    this.viewer.addLayerBuilder(TextLayerBuilder)
    this.viewer.addLayerBuilder(AnnotationLayerBuilder)
    this.viewer.addLayerBuilder(XfaLayerBuilder)
    this.viewer.addLayerBuilder(StructTreeLayerBuilder)
  }
}

export class PdfonEditor extends Pdfon {
  constructor() {
    super({
      plugins: [
        EditorPlugin,
        InteractionEditorPlugin,
        // TourEditorPlugin,
      ],
    })
  }
}
