import type { IRenderableView as BaseIRenderableView, IDownloadManager } from 'pdfjs-dist/types/web/interfaces'
import type { Metadata } from 'pdfjs-dist/types/src/display/metadata'
import type { OptionalContentConfig } from 'pdfjs-dist/types/src/display/optional_content_config'
import type { AnnotationLayerParameters } from 'pdfjs-dist/types/src/display/annotation_layer'
import type { AnnotationEditorLayerOptions } from 'pdfjs-dist/types/src/display/editor/annotation_editor_layer'
import type { StructTreeNode, StructTreeContent, DocumentInitParameters } from 'pdfjs-dist/types/src/display/api'
import type { XfaLayerParameters } from 'pdfjs-dist/types/src/display/xfa_layer'
import type { PrintAnnotationStorage } from 'pdfjs-dist/types/src/display/annotation_storage'

interface IRenderableView extends BaseIRenderableView {
  get isRenderingFinished(): boolean
}

export type DocumentType = string | URL | ArrayBuffer | DocumentInitParameters

export * from 'pdfjs-dist'

export type {
  IRenderableView,
  IDownloadManager,
  Metadata,
  OptionalContentConfig,
  AnnotationLayerParameters,
  AnnotationEditorLayerOptions,
  StructTreeNode,
  StructTreeContent,
  XfaLayerParameters,
  PrintAnnotationStorage,
}
