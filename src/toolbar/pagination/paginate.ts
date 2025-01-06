import { type Toolbar, ToolbarItem } from '@/toolbar'
import { NextPage } from './next-page'
import { PreviousPage } from './previous-page'
import { InputPage } from './input-page'

export class Paginate extends ToolbarItem {
  protected previousPage = new PreviousPage()
  protected nextPage = new NextPage()
  protected inputPage = new InputPage()

  setToolbar(toolbar: Toolbar) {
    super.setToolbar(toolbar)
    this.previousPage.setToolbar(toolbar)
    this.nextPage.setToolbar(toolbar)
    this.inputPage.setToolbar(toolbar)
  }

  async initialize() {
    await super.initialize()
    await this.previousPage.initialize()
    await this.nextPage.initialize()
    await this.inputPage.initialize()
  }

  async terminate() {
    await this.previousPage.terminate()
    await this.nextPage.terminate()
    await this.inputPage.terminate()
    await super.terminate()
  }

  render() {
    this.container.appendChild(this.previousPage.render())
    this.container.appendChild(this.nextPage.render())
    this.container.appendChild(this.inputPage.render())

    return super.render()
  }
}
