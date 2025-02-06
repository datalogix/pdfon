import { AnnotationEditorParamsType, AnnotationEditorType } from '@/pdfjs'
import { AnnotationEditorBaseToolbarItem } from './annotation-editor-base-toolbar-item'

export class AnnotationEditorFreeTextToolbarItem extends AnnotationEditorBaseToolbarItem {
  protected value = AnnotationEditorType.FREETEXT

  protected buildAnnotationEditorBar() {
    const colorField = this.buildField({
      label: this.l10n.get('annotation-editor.free-text.color'),
      inputProps: { type: 'color' },
      annotationEditorParamsType: AnnotationEditorParamsType.FREETEXT_COLOR,
    })

    const sizeField = this.buildField({
      label: this.l10n.get('annotation-editor.free-text.size'),
      inputProps: { type: 'range', value: 10, min: 5, max: 100, step: 1 },
      annotationEditorParamsType: AnnotationEditorParamsType.FREETEXT_SIZE,
    })

    this.annotationEditorBar.append(
      colorField.container,
      sizeField.container,
    )
  }
}
