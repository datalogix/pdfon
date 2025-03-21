import { Dispatcher, type EventBus } from '@/bus'
import type { Translator } from '@/l10n'
import type { ViewerType } from '@/viewer'
import { Drawer } from '@/tools'
import { createElement } from '@/utils'
import type { SidebarItem } from './sidebar-item'

export class SidebarManager extends Dispatcher {
  protected container = createElement('div', 'sidebar')
  protected menu = createElement('ul', 'sidebar-menu')
  protected items = new Map<string, SidebarItem>()
  protected current?: string
  protected drawer = new Drawer({
    backdrop: false,
    classes: 'sidebar-drawer',
    onClose: () => this.close(),
  })

  constructor(
    readonly eventBus: EventBus,
    readonly viewer: ViewerType,
    readonly translator: Translator,
  ) {
    super()

    this.container.appendChild(this.menu)
    this.viewer.rootContainer.append(this.drawer.render(this.container))
  }

  get length() {
    return this.items.size
  }

  get opened() {
    return this.drawer.isOpened
  }

  open() {
    if (!this.length) return

    if (this.current) {
      this.select(this.current)
    } else {
      (this.menu.children[0] as HTMLButtonElement).click()
    }

    this.drawer.open()
    this.dispatch('SidebarOpen')
  }

  close() {
    this.drawer.close()

    if (this.current) {
      this.items.get(this.current)?.hide()
    }

    this.dispatch('SidebarClose')
  }

  add(item: SidebarItem, order?: number) {
    order = order ?? item.order
    this.items.set(item.name, item)

    item.setSidebarManager(this)
    const button = this.createButton(item, order)

    this.menu.appendChild(button)
    this.container.appendChild(item.render())

    this.sortMenu()
  }

  delete(item: SidebarItem) {
    this.removeButtons(item.name)
    this.items.delete(item.name)
    this.current = undefined
    this.close()
  }

  select(name?: string) {
    if (!name || !this.items.has(name)) return

    if (name !== this.current) {
      this.deselectCurrent()
      this.highlightButton(name)

      if (this.current) {
        this.items.get(this.current)?.hide()
      }

      this.current = name
      this.dispatch('SidebarSelected', { sidebar: name })
    }

    queueMicrotask(() => {
      if (this.opened) {
        this.items.get(name)!.show()
      }
    })
  }

  async destroy() {
    for (const item of this.items.values()) {
      await item.terminate()
    }

    this.current = undefined
    this.items.clear()
  }

  private createButton(item: SidebarItem, order?: number): HTMLButtonElement {
    const button = createElement('button', ['sidebar-item', `sidebar-item-${item.name}`], {
      type: 'button',
      innerHTML: `<span>${this.translator.translate(`${item.name}.label`)}</span>`,
      title: this.translator.translate(`${item.name}.title`),
    })

    if (order) button.dataset.order = order.toString()
    button.addEventListener('click', () => this.select(item.name))

    return button
  }

  private sortMenu() {
    const buttons = Array.from(this.menu.children) as HTMLButtonElement[]

    buttons
      .sort((a, b) =>
        parseInt(a.dataset.order ?? this.length.toString(), 10)
        - parseInt(b.dataset.order ?? this.length.toString(), 10),
      )
      .forEach(button => this.menu.appendChild(button))
  }

  private removeButtons(name: string) {
    const buttons = this.menu.getElementsByClassName(`sidebar-item-${name}`)

    while (buttons.length > 0) {
      buttons[0].remove()
    }
  }

  private deselectCurrent() {
    this.container.querySelector('.sidebar-item.selected')?.classList.remove('selected')
  }

  private highlightButton(name: string) {
    this.container.querySelector(`.sidebar-item-${name}`)?.classList.add('selected')
  }
}
