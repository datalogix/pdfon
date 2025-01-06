import { createElement } from '@/tools'
import { removeNullCharacters } from './viewer/utils'

export abstract class BaseTreeViewer<T> {
  private lastToggleIsShow: boolean = true
  private currentTreeItem?: HTMLElement

  protected abstract dispatchEvent(count: number): void

  protected abstract render(params: T): void

  constructor(public readonly options: {
    container: HTMLDivElement
    eventBus: any
    l10n: any
  }) {
    this.reset()
  }

  reset() {
    this.lastToggleIsShow = true
    this.currentTreeItem = undefined
    this.options.container.textContent = ''
    this.options.container.classList.remove('treeWithDeepNesting')
  }

  protected normalizeTextContent(str: string) {
    return removeNullCharacters(str, true) || '\u2013'
  }

  protected addToggleButton(div: HTMLDivElement, hidden: boolean | object = false) {
    const toggler = createElement('div')
    toggler.className = 'treeItemToggler'

    if (hidden) {
      toggler.classList.add('treeItemsHidden')
    }

    toggler.addEventListener('click', (event: MouseEvent) => {
      event.stopPropagation()
      toggler.classList.toggle('treeItemsHidden')

      if (event.shiftKey) {
        const shouldShowAll = !toggler.classList.contains('treeItemsHidden')
        this.toggleTreeItem(div, shouldShowAll)
      }
    }, true)

    div.prepend(toggler)
  }

  private toggleTreeItem(root: Element, show: boolean = false) {
    this.options.l10n.pause()
    this.lastToggleIsShow = show

    root.querySelectorAll('.treeItemToggler').forEach(toggler => {
      toggler.classList.toggle('treeItemsHidden', !show)
    })

    this.options.l10n.resume()
  }

  protected toggleAllTreeItems() {
    this.toggleTreeItem(this.options.container, !this.lastToggleIsShow)
  }

  protected finishRendering(fragment: DocumentFragment, count: number, hasAnyNesting: boolean = false) {
    if (hasAnyNesting) {
      this.options.container.classList.add('treeWithDeepNesting')
      this.lastToggleIsShow = !fragment.querySelector('.treeItemsHidden')
    }
    this.options.l10n.pause()
    this.options.container.append(fragment)
    this.options.l10n.resume()
    this.dispatchEvent(count)
  }

  protected updateCurrentTreeItem(treeItem?: HTMLElement) {
    if (this.currentTreeItem) {
      this.currentTreeItem.classList.remove('selected')
      this.currentTreeItem = undefined
    }

    if (treeItem) {
      treeItem.classList.add('selected')
      this.currentTreeItem = treeItem
    }
  }

  protected scrollToCurrentTreeItem(treeItem?: HTMLElement) {
    if (!treeItem) return

    this.options.l10n.pause()

    let currentNode = treeItem.parentElement

    while (currentNode && currentNode !== this.options.container) {
      if (currentNode.classList.contains('treeItem')) {
        const toggler = currentNode.firstElementChild
        toggler?.classList.remove('treeItemsHidden')
      }

      currentNode = currentNode.parentElement
    }

    this.options.l10n.resume()
    this.updateCurrentTreeItem(treeItem)
    this.options.container.scrollTo(treeItem.offsetLeft, treeItem.offsetTop + -100)
  }
}
