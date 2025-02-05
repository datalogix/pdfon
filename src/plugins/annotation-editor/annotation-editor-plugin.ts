import { Plugin, type ToolbarItemType } from '../plugin'
import { AnnotationEditorFreeTextToolbarItem } from './annotation-editor-free-text-toolbar-item'
import { AnnotationEditorGroupToolbarItem } from './annotation-editor-group-toolbar-item'
import { AnnotationEditorHighlightToolbarItem } from './annotation-editor-highlight-toolbar-item'
import { AnnotationEditorInkToolbarItem } from './annotation-editor-ink-toolbar-item'
import { AnnotationEditorLayerBuilder } from './annotation-editor-layer-builder'
import { AnnotationEditorStorage } from './annotation-editor-storage'

export class AnnotationEditorPlugin extends Plugin {
  protected getToolbarItems() {
    return new Map<string, ToolbarItemType>([
      ['annotation-editor-group', AnnotationEditorGroupToolbarItem],
      ['annotation-editor-free-text', AnnotationEditorFreeTextToolbarItem],
      ['annotation-editor-highlight', AnnotationEditorHighlightToolbarItem],
      ['annotation-editor-ink', AnnotationEditorInkToolbarItem],
    ])
  }

  protected layerBuilders = [AnnotationEditorLayerBuilder]
  private _annotationEditorStorage?: AnnotationEditorStorage

  get annotationEditorStorage() {
    return this._annotationEditorStorage
  }

  protected init() {
    this._annotationEditorStorage = new AnnotationEditorStorage(this.eventBus)
  }

  protected destroy() {
    this._annotationEditorStorage?.destroy()
    this._annotationEditorStorage = undefined
  }
}
