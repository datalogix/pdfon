import { AnnotationEditorParamsType, AnnotationEditorType } from '@/pdfjs'
import { AnnotationEditorBaseToolbarItem } from './annotation-editor-base-toolbar-item'

export class AnnotationEditorInkToolbarItem extends AnnotationEditorBaseToolbarItem {
  protected value = AnnotationEditorType.INK

  protected buildAnnotationEditorBar() {
    const colorField = this.buildField({
      label: this.l10n.get('annotation-editor.ink.color'),
      inputProps: { type: 'color' },
      annotationEditorParamsType: AnnotationEditorParamsType.INK_COLOR,
    })

    const thicknessField = this.buildField({
      label: this.l10n.get('annotation-editor.ink.thickness'),
      inputProps: { type: 'range', value: 1, min: 1, max: 20, step: 1 },
      annotationEditorParamsType: AnnotationEditorParamsType.INK_THICKNESS,
    })

    const opacityField = this.buildField({
      label: this.l10n.get('annotation-editor.ink.opacity'),
      inputProps: { type: 'range', value: 1, min: 0.05, max: 1, step: 0.05 },
      annotationEditorParamsType: AnnotationEditorParamsType.INK_OPACITY,
    })

    this.annotationEditorBar.append(
      colorField.container,
      thicknessField.container,
      opacityField.container,
    )
  }
}
