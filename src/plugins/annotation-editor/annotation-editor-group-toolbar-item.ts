import { ToolbarGroup } from '@/toolbar'
import { AnnotationEditorFreeTextToolbarItem } from './annotation-editor-free-text-toolbar-item'
import { AnnotationEditorHighlightToolbarItem } from './annotation-editor-highlight-toolbar-item'
import { AnnotationEditorInkToolbarItem } from './annotation-editor-ink-toolbar-item'

export class AnnotationEditorGroupToolbarItem extends ToolbarGroup {
  constructor() {
    super([
      new AnnotationEditorFreeTextToolbarItem(),
      new AnnotationEditorHighlightToolbarItem(),
      new AnnotationEditorInkToolbarItem(),
    ])
  }
}
