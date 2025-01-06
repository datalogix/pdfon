import { AnnotationEditorType } from '@/pdfjs'
import { AnnotationBase } from './annotation-base'

export class AnnotationInk extends AnnotationBase {
  protected value = AnnotationEditorType.INK
}
