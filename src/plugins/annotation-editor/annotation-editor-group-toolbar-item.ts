import { type Toolbar, ToolbarItem } from '@/toolbar'
import { AnnotationEditorFreeTextToolbarItem } from './annotation-editor-free-text-toolbar-item'
import { AnnotationEditorHighlightToolbarItem } from './annotation-editor-highlight-toolbar-item'
import { AnnotationEditorInkToolbarItem } from './annotation-editor-ink-toolbar-item'

export class AnnotationEditorGroupToolbarItem extends ToolbarItem {
  protected freeText = new AnnotationEditorFreeTextToolbarItem()
  protected highlight = new AnnotationEditorHighlightToolbarItem()
  protected ink = new AnnotationEditorInkToolbarItem()

  setToolbar(toolbar: Toolbar) {
    super.setToolbar(toolbar)
    this.freeText.setToolbar(toolbar)
    this.highlight.setToolbar(toolbar)
    this.ink.setToolbar(toolbar)
  }

  async initialize() {
    await super.initialize()
    await this.freeText.initialize()
    await this.highlight.initialize()
    await this.ink.initialize()
  }

  async terminate() {
    await this.freeText.terminate()
    await this.highlight.terminate()
    await this.ink.terminate()
    await super.terminate()
  }

  render() {
    this.container.appendChild(this.freeText.render())
    this.container.appendChild(this.highlight.render())
    this.container.appendChild(this.ink.render())
    return super.render()
  }
}
