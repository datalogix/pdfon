import { AnnotationEditorType } from '@/pdfjs'
import { ToolbarActionToggle } from '@/toolbar'
import { createElement } from '@/utils'
import type { AnnotationEditorPlugin } from './annotation-editor-plugin'

export abstract class AnnotationEditorBaseToolbarItem extends ToolbarActionToggle {
  protected abstract value: number
  protected annotationEditorBar = createElement('div', 'annotation-editor-bar')

  get annotationEditorPlugin() {
    return this.viewer.getLayerProperty<AnnotationEditorPlugin>('AnnotationEditorPlugin')!
  }

  get enabled() {
    return !!this.viewer.annotationEditorUIManager
  }

  get activated() {
    return this.viewer.getAnnotationEditorMode() === this.value
  }

  protected init() {
    this.on('DocumentDestroy', () => {
      this.dispatch('SwitchAnnotationEditorMode', {
        mode: AnnotationEditorType.NONE,
      })
    })

    this.on(`${this.name}Toggle`, () => {
      this.dispatch('SwitchAnnotationEditorMode', {
        mode: this.opened ? this.value : AnnotationEditorType.NONE,
      })
    })

    this.on('AnnotationEditorModeChanged', ({ mode }) => {
      this.markAsActivated()

      if (mode === this.value) {
        this.annotationEditorBar.classList.add('annotation-editor-bar-open')
        this.opened = true
      } else {
        this.annotationEditorBar.classList.remove('annotation-editor-bar-open')
        this.opened = false
      }
    })

    this.container.appendChild(this.annotationEditorBar)
    this.buildAnnotationEditorBar()
  }

  protected abstract buildAnnotationEditorBar(): void

  protected buildField<T extends HTMLElement = HTMLInputElement>({ label, input, inputProps, annotationEditorParamsType }: {
    label: string
    input?: T
    inputProps?: Record<string, any>
    annotationEditorParamsType?: number
  }) {
    const container = createElement('label', 'annotation-field')
    const text = createElement('span', { innerText: label })
    const field = input ?? createElement('input', inputProps)

    container.append(text, field)

    if (annotationEditorParamsType && field instanceof HTMLInputElement) {
      field.addEventListener('input', () => {
        this.dispatch('SwitchAnnotationEditorParams', {
          type: annotationEditorParamsType,
          value: field.type === 'range' || field.type === 'number'
            ? field.valueAsNumber
            : (field.type === 'checkbox' ? field.checked : field.value),
        })
      })

      this.on('AnnotationEditorParamsChanged', (event) => {
        for (const [type, value] of event.details) {
          if (type === annotationEditorParamsType) {
            field.value = value
          }
        }
      })
    }

    return {
      container,
      text,
      field,
    }
  }
}
