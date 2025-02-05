import { AnnotationEditorType } from '@/pdfjs'
import { ToolbarActionToggle } from '@/toolbar'
import { createElement } from '@/utils'

export abstract class AnnotationEditorBaseToolbarItem extends ToolbarActionToggle {
  protected abstract value: number
  protected annotationBar = createElement('div', 'annotation-editor-bar')

  get enabled() {
    return !!this.viewer.annotationEditorUIManager
  }

  get activated() {
    return this.viewer.getAnnotationEditorMode() === this.value
  }

  protected init() {
    this.on(`${this.name}toggle`, () => {
      this.dispatch('switchannotationeditormode', {
        mode: this.opened ? this.value : AnnotationEditorType.NONE,
      })
    })

    this.on('annotationeditormodechanged', ({ mode }) => {
      this.markAsActivated()

      if (mode === this.value) {
        this.annotationBar.classList.add('annotation-editor-bar-open')
        this.opened = true
      } else {
        this.annotationBar.classList.remove('annotation-editor-bar-open')
        this.opened = false
      }
    })

    this.container.appendChild(this.annotationBar)
    this.buildAnnotationBar()
  }

  protected abstract buildAnnotationBar(): void

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
        this.dispatch('switchannotationeditorparams', {
          type: annotationEditorParamsType,
          value: field.type === 'range' || field.type === 'number'
            ? field.valueAsNumber
            : (field.type === 'checkbox' ? field.checked : field.value),
        })
      })

      this.on('annotationeditorparamschanged', (event) => {
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
