import { AnnotationEditorType } from '@/pdfjs'
import { AnnotationBase } from './annotation-base'

export class AnnotationFreeText extends AnnotationBase {
  protected value = AnnotationEditorType.FREETEXT
}
