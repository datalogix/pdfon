import { AnnotationEditorType } from '@/pdfjs'
import { ToolbarAction } from '@/toolbar'

export abstract class AnnotationBase extends ToolbarAction {
  protected abstract value: number

  get enabled() {
    return !!this.viewer.annotationEditorUIManager
  }

  get activated() {
    return this.viewer.getAnnotationEditorMode() === this.value
  }

  protected init() {
    this.on('annotationeditormodechanged', () => this.markAsActivated())
    this.on('showannotationeditorui', ({ mode }) => {
      if (mode === this.value) {
        this.execute()
      }
    })
  }

  protected execute() {
    const mode = this.activated ? AnnotationEditorType.NONE : this.value
    this.dispatch('switchannotationeditormode', { mode })
  }
}
