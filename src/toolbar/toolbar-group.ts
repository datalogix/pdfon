import { type Toolbar, ToolbarItem } from '@/toolbar'

export class ToolbarGroup extends ToolbarItem {
  constructor(readonly items: ToolbarItem[]) {
    super()
  }

  setToolbar(toolbar: Toolbar) {
    super.setToolbar(toolbar)

    this.items.forEach(item => item.setToolbar(toolbar))
  }

  async initialize() {
    await super.initialize()
    await Promise.all(this.items.map(item => item.initialize()))
  }

  async terminate() {
    await Promise.all(this.items.map(item => item.terminate()))
    await super.terminate()
  }

  render() {
    this.items.forEach(item => this.container.appendChild(item.render()))

    return super.render()
  }
}
