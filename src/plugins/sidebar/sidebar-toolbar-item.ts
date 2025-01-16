import { ToolbarActionToggle } from '@/toolbar'
import { Drawer } from '@/tools'
import { createElement } from '@/utils'
import type { SidebarItem } from './sidebar-item'
import type { SidebarType } from './sidebar-types'

export class SidebarToolbarItem extends ToolbarActionToggle {
  protected element = createElement('div', 'sidebar')
  protected menu = createElement('ul', 'sidebar-menu')
  protected items = new Map<SidebarType, SidebarItem>()
  protected current?: SidebarType
  protected drawer = new Drawer({
    backdrop: false,
    classes: 'sidebar-drawer',
    onClose: () => this.opened = false,
  })

  constructor(protected list = new Map<SidebarType, SidebarItem>()) {
    super()

    this.element.appendChild(this.menu)
  }

  get enabled() {
    return this.items.size > 0
  }

  protected init() {
    this.drawer.render(this.element, this.viewer.rootContainer)
    this.list.forEach((item, key) => this.add(key, item))

    this.on('sidebarselect', ({ key, open }) => {
      this.select(key)

      if (open && !this.opened) {
        this.execute()
      }
    })
  }

  protected async destroy() {
    for (const item of this.items.values()) {
      await item.terminate()
    }

    this.current = undefined
    this.items.clear()
    // this.element.remove()
  }

  find(item: SidebarItem): SidebarType[] {
    const keys: SidebarType[] = []

    this.items.forEach((value, key) => {
      if (item === value) {
        keys.push(key)
      }
    })

    return keys
  }

  add(key: SidebarType, item: SidebarItem) {
    this.items.set(key, item)

    item.setSidebar(this)

    const button = createElement('button', ['sidebar-item', `sidebar-item-${key}`], {
      type: 'button',
      innerHTML: `<span>${this.l10n.get(`sidebar.${key}.label`)}</span>`,
      title: this.l10n.get(`sidebar.${key}.title`),
    })
    button.addEventListener('click', () => this.select(key))
    this.menu.appendChild(button)

    this.element.appendChild(item.render())
  }

  remove(item: SidebarItem) {
    this.find(item).forEach((key) => {
      const items = this.menu.getElementsByClassName(`sidebar-item-${key}`)

      while (items.length > 0) {
        items[0].remove()
      }

      this.items.delete(key)
    })

    this.current = undefined
    this.close()
  }

  select(key: SidebarType) {
    if (!this.items.has(key)) return

    this.element.querySelector('.sidebar-item.selected')?.classList.remove('selected')
    this.element.querySelector(`.sidebar-item-${key}`)?.classList.add('selected')

    if (this.current) {
      this.items.get(this.current)?.hide()
    }

    this.current = key
    this.dispatch('sidebarselected', { key })

    if (this.opened) {
      this.items.get(key)!.show()
    }
  }

  open() {
    this.select(this.current ?? this.items.keys().next().value ?? '')
    this.drawer.open()
  }

  close() {
    this.drawer.close()

    if (this.current) {
      this.items.get(this.current)?.hide()
    }
  }
}
