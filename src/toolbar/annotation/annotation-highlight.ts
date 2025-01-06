import { AnnotationEditorType } from '@/pdfjs'
import { AnnotationBase } from './annotation-base'

export class AnnotationHighlight extends AnnotationBase {
  protected value = AnnotationEditorType.HIGHLIGHT
}
