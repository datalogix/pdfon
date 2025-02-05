import type { IRenderableView as BaseIRenderableView } from 'pdfjs-dist/types/web/interfaces'
import type { DocumentInitParameters } from 'pdfjs-dist/types/src/display/api'

export type { IDownloadManager } from 'pdfjs-dist/types/web/interfaces'
export type { Metadata } from 'pdfjs-dist/types/src/display/metadata'
export type { OptionalContentConfig } from 'pdfjs-dist/types/src/display/optional_content_config'
export type { AnnotationLayerParameters } from 'pdfjs-dist/types/src/display/annotation_layer'
export type { AnnotationEditorLayerOptions } from 'pdfjs-dist/types/src/display/editor/annotation_editor_layer'
export type { StructTreeNode, StructTreeContent } from 'pdfjs-dist/types/src/display/api'
export type { XfaLayerParameters } from 'pdfjs-dist/types/src/display/xfa_layer'
export type { PrintAnnotationStorage } from 'pdfjs-dist/types/src/display/annotation_storage'
export type { AnnotationEditor } from 'pdfjs-dist/types/src/display/editor/tools'

export interface IRenderableView extends BaseIRenderableView {
  get isRenderingFinished(): boolean
}

export type DocumentType = string | URL | ArrayBuffer | DocumentInitParameters

export * from 'pdfjs-dist'
