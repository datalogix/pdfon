import { type Toolbar, ToolbarItem } from '@/toolbar'
import { AnnotationFreeText } from './annotation-free-text'
import { AnnotationHighlight } from './annotation-highlight'
import { AnnotationInk } from './annotation-ink'

export class Annotation extends ToolbarItem {
  protected freeText = new AnnotationFreeText()
  protected highlight = new AnnotationHighlight()
  protected ink = new AnnotationInk()

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
