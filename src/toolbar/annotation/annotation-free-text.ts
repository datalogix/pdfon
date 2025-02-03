import { AnnotationEditorParamsType, AnnotationEditorType } from '@/pdfjs'
import { AnnotationBase } from './annotation-base'

export class AnnotationFreeText extends AnnotationBase {
  protected value = AnnotationEditorType.FREETEXT

  protected buildAnnotationBar() {
    const colorField = this.buildField({
      label: this.l10n.get('annotation.free-text.color'),
      inputProps: { type: 'color' },
      annotationEditorParamsType: AnnotationEditorParamsType.FREETEXT_COLOR,
    })

    const sizeField = this.buildField({
      label: this.l10n.get('annotation.free-text.size'),
      inputProps: { type: 'range', value: 10, min: 5, max: 100, step: 1 },
      annotationEditorParamsType: AnnotationEditorParamsType.FREETEXT_SIZE,
    })

    this.annotationBar.append(
      colorField.container,
      sizeField.container,
    )
  }
}
