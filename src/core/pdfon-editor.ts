import { FullscreenPlugin, InteractionEditorPlugin, LoadingPlugin, NotifyPlugin, Plugin } from '@/plugins'
import { AnnotationLayerBuilder, StructTreeLayerBuilder, TextLayerBuilder, XfaLayerBuilder } from '@/viewer'
import { Pdfon, type PdfonOptions } from './pdfon'

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
        FullscreenPlugin,
        LoadingPlugin,
        NotifyPlugin,
        InteractionEditorPlugin,
      ],
    })
  }

  async render(options: Partial<PdfonOptions> = {}) {
    return super.render({
      container: 'editor',
      viewerOptions: {
        enableTitleUpdate: false,
      },
      ...options,
    })
  }
}
