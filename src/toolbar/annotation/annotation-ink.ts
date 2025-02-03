import { AnnotationEditorParamsType, AnnotationEditorType } from '@/pdfjs'
import { AnnotationBase } from './annotation-base'

export class AnnotationInk extends AnnotationBase {
  protected value = AnnotationEditorType.INK

  protected buildAnnotationBar() {
    const colorField = this.buildField({
      label: this.l10n.get('annotation.ink.color'),
      inputProps: { type: 'color' },
      annotationEditorParamsType: AnnotationEditorParamsType.INK_COLOR,
    })

    const thicknessField = this.buildField({
      label: this.l10n.get('annotation.ink.thickness'),
      inputProps: { type: 'range', value: 1, min: 1, max: 20, step: 1 },
      annotationEditorParamsType: AnnotationEditorParamsType.INK_THICKNESS,
    })

    const opacityField = this.buildField({
      label: this.l10n.get('annotation.ink.opacity'),
      inputProps: { type: 'range', value: 1, min: 0.05, max: 1, step: 0.05 },
      annotationEditorParamsType: AnnotationEditorParamsType.INK_OPACITY,
    })

    this.annotationBar.append(
      colorField.container,
      thicknessField.container,
      opacityField.container,
    )
  }
}
