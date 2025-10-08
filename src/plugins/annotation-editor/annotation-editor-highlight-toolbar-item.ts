import { AnnotationEditorParamsType, AnnotationEditorType, ColorPicker } from '@/pdfjs'
import { createElement } from '@/utils'
import { AnnotationEditorBaseToolbarItem } from './annotation-editor-base-toolbar-item'

export class AnnotationEditorHighlightToolbarItem extends AnnotationEditorBaseToolbarItem {
  protected value = AnnotationEditorType.HIGHLIGHT

  protected buildAnnotationEditorBar() {
    const colorField = this.buildField({
      label: this.annotationEditorPlugin.translate('highlight.color'),
      input: createElement('div', 'colorPicker'),
    })

    const thicknessField = this.buildField({
      label: this.annotationEditorPlugin.translate('highlight.thickness'),
      inputProps: { type: 'range', value: 12, min: 8, max: 24, step: 1 },
      annotationEditorParamsType: AnnotationEditorParamsType.HIGHLIGHT_THICKNESS,
    })

    const showAllField = this.buildField({
      label: this.annotationEditorPlugin.translate('highlight.show-all'),
      inputProps: { type: 'checkbox', checked: true, className: 'switch' },
      annotationEditorParamsType: AnnotationEditorParamsType.HIGHLIGHT_SHOW_ALL,
    })

    this.annotationEditorBar.append(
      colorField.container,
      thicknessField.container,
      showAllField.container,
    )

    let colorPicker: ColorPicker | null = null

    this.on('AnnotationEditorUIManager', ({ uiManager }) => {
      colorPicker = new ColorPicker({ uiManager })
      uiManager.setMainHighlightColorPicker(colorPicker)
      colorField.field.append(colorPicker.renderMainDropdown())
    })

    this.on('AnnotationEditorParamsChanged', (event) => {
      for (const [type, value] of event.details) {
        switch (type) {
          case AnnotationEditorParamsType.HIGHLIGHT_FREE:
            thicknessField.field.disabled = !value
            break
          case AnnotationEditorParamsType.HIGHLIGHT_DEFAULT_COLOR:
            colorPicker?.updateColor(value)
            break
        }
      }
    })
  }
}
