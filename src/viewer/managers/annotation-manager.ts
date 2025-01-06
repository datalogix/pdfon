import { AnnotationEditorUIManager, AnnotationMode, AnnotationEditorType } from '@/pdfjs'
import type { Page } from '../page'
import { Manager } from './manager'

export function isValidAnnotationEditorMode(mode: number) {
  return (
    Number.isInteger(mode)
    && Object.values(AnnotationEditorType).includes(mode)
    && mode !== AnnotationEditorType.DISABLE
  )
}

export class AnnotationManager extends Manager {
  private _annotationEditorUIManager?: AnnotationEditorUIManager
  private _annotationMode!: number
  private _annotationEditorMode!: number
  private switchAnnotationEditorModeTimeoutId?: NodeJS.Timeout
  private onPageRenderedCallback?: ({ pageNumber }: { pageNumber: number }) => void

  init() {
    this._annotationMode = this.options.annotationMode ?? AnnotationMode.ENABLE_FORMS
    this._annotationEditorMode = this.options.annotationEditorMode ?? AnnotationEditorType.NONE

    this.on('firstpageloaded', ({ annotationEditorMode }) => {
      this.initAnnotationEditorUIManager(annotationEditorMode)
    })

    this.on('onepagerendered', ({ annotationEditorMode }) => {
      if (this.annotationEditorUIManager) {
        this.dispatch('annotationeditormodechanged', { mode: annotationEditorMode })
      }
    })

    this.on('switchannotationeditormode', (params) => {
      if (this.annotationEditorUIManager) {
        this.annotationEditorMode = params
      }
    })
  }

  reset() {
    this.cleanupSwitchAnnotationEditorMode()
    this.destroyAnnotationEditorUIManager()
  }

  private initAnnotationEditorUIManager(mode: number) {
    if (mode === AnnotationEditorType.DISABLE) {
      return
    }

    if (this.pdfDocument?.isPureXfa) {
      this.logger.warn('Warning: XFA-editing is not implemented.')
      return
    }

    if (!isValidAnnotationEditorMode(mode)) {
      this.logger.error(`Invalid AnnotationEditor mode: ${mode}`)
    }

    this._annotationEditorUIManager = new AnnotationEditorUIManager(
      this.container,
      this.viewerContainer,
      null, // altTextManager
      this.eventBus,
      this.pdfDocument,
      this.viewer.pageColors,
      this.options.annotationEditorHighlightColors ?? 'yellow=#FFFF98,green=#53FFBC,blue=#80EBFF,pink=#FFCBE6,red=#FF4F5F',
      this.options.enableHighlightFloatingButton ?? true,
      null, // enableUpdatedAddImage
      null, // enableNewAltTextWhenAddingImage
      null, // mlManager
    )

    this.dispatch('annotationeditoruimanager', { uiManager: this._annotationEditorUIManager })

    if (mode === AnnotationEditorType.NONE) {
      return
    }

    this._annotationEditorUIManager?.updateMode(mode)
  }

  private destroyAnnotationEditorUIManager() {
    this._annotationEditorUIManager?.destroy()
    this._annotationEditorUIManager = undefined
  }

  get annotationMode() {
    return this._annotationMode
  }

  getAnnotationEditorMode() {
    return this._annotationEditorUIManager ? this._annotationEditorMode : AnnotationEditorType.DISABLE
  }

  get annotationEditorUIManager() {
    return this._annotationEditorUIManager
  }

  get renderForms() {
    return this.annotationMode === AnnotationMode.ENABLE_FORMS
  }

  set annotationEditorMode({ mode, editId, isFromKeyboard }: { mode: number, editId?: string, isFromKeyboard?: boolean }) {
    if (!this._annotationEditorUIManager) {
      throw new Error(`The AnnotationEditor is not enabled.`)
    }

    if (this._annotationEditorMode === mode) {
      return
    }

    if (!isValidAnnotationEditorMode(mode)) {
      throw new Error(`Invalid AnnotationEditor mode: ${mode}`)
    }

    if (!this.pdfDocument) {
      return
    }

    const updater = () => {
      this.cleanupSwitchAnnotationEditorMode()
      this._annotationEditorMode = mode
      this._annotationEditorUIManager?.updateMode(mode, editId, isFromKeyboard)
      this.dispatch('annotationeditormodechanged', { mode })
    }

    if (mode === AnnotationEditorType.NONE || this._annotationEditorMode === AnnotationEditorType.NONE) {
      const isEditing = mode !== AnnotationEditorType.NONE

      if (!isEditing) {
        this.pdfDocument.annotationStorage.resetModifiedIds()
      }

      for (const page of this.pagesManager.pages) {
        page.toggleEditingMode(isEditing)
      }

      const idsToRefresh = this.switchToEditAnnotationMode()

      if (isEditing && idsToRefresh) {
        this.cleanupSwitchAnnotationEditorMode()
        this.onPageRenderedCallback = ({ pageNumber }) => {
          idsToRefresh.delete(pageNumber)

          if (idsToRefresh.size === 0) {
            this.switchAnnotationEditorModeTimeoutId = setTimeout(updater, 0)
          }
        }

        this.on(
          'pagerendered',
          this.onPageRenderedCallback,
          { signal: this.pagesManager.signal },
        )

        return
      }
    }

    updater()
  }

  private cleanupSwitchAnnotationEditorMode() {
    if (this.onPageRenderedCallback) {
      this.off('pagerendered', this.onPageRenderedCallback)
      this.onPageRenderedCallback = undefined
    }

    if (this.switchAnnotationEditorModeTimeoutId !== undefined) {
      clearTimeout(this.switchAnnotationEditorModeTimeoutId)
      this.switchAnnotationEditorModeTimeoutId = undefined
    }
  }

  private switchToEditAnnotationMode() {
    const visible = this.scrollManager.getVisiblePages()
    const pagesToRefresh = []
    const { ids, views } = visible

    for (const page of views) {
      const { view } = page

      if (!(view as Page).hasEditableAnnotations()) {
        ids.delete(view.id)
        continue
      }

      pagesToRefresh.push(page)
    }

    if (pagesToRefresh.length === 0) {
      return null
    }

    this.renderManager.renderingQueue.renderHighestPriority({
      first: pagesToRefresh[0],
      last: pagesToRefresh.at(-1),
      views: pagesToRefresh,
      ids,
    })

    return ids
  }
}
