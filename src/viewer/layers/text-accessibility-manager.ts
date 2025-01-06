import { binarySearchFirstItem } from '@/utils'

export class TextAccessibilityManager {
  private enabled = false
  private textChildren?: Element[]
  private textNodes: Map<string, number> = new Map()
  private waitingElements: Map<Element, boolean> = new Map()

  setTextMapping(textDivs: Element[]) {
    this.textChildren = textDivs
  }

  enable() {
    if (this.enabled) {
      throw new Error('TextAccessibilityManager is already enabled.')
    }

    if (!this.textChildren) {
      throw new Error('Text divs and strings have not been set.')
    }

    this.enabled = true
    this.textChildren = this.textChildren.slice()
    this.textChildren.sort(compareElementPositions)

    if (this.textNodes.size > 0) {
      const textChildren = this.textChildren

      for (const [id, nodeIndex] of this.textNodes) {
        const element = document.getElementById(id)

        if (!element) {
          this.textNodes.delete(id)
          continue
        }

        addIdToAriaOwns(id, textChildren[nodeIndex])
      }
    }

    for (const [element, isRemovable] of this.waitingElements) {
      this.addPointerInTextLayer(element, isRemovable)
    }

    this.waitingElements.clear()
  }

  disable() {
    if (!this.enabled) return

    this.waitingElements.clear()
    this.textChildren = undefined
    this.enabled = false
  }

  removePointerInTextLayer(element: Element) {
    if (!this.enabled) {
      this.waitingElements.delete(element)
      return
    }

    const children = this.textChildren
    if (!children || children.length === 0) {
      return
    }

    const nodeIndex = this.textNodes.get(element.id)
    if (nodeIndex === undefined) {
      return
    }

    const node = children[nodeIndex]
    this.textNodes.delete(element.id)
    let owns = node.getAttribute('aria-owns')

    if (!owns?.includes(element.id)) {
      return
    }

    owns = owns.split(' ').filter(x => x !== element.id).join(' ')

    if (owns) {
      node.setAttribute('aria-owns', owns)
    } else {
      node.removeAttribute('aria-owns')
      node.setAttribute('role', 'presentation')
    }
  }

  addPointerInTextLayer(element: Element, isRemovable: boolean) {
    if (!element.id) {
      return null
    }

    if (!this.enabled) {
      this.waitingElements.set(element, isRemovable)
      return null
    }

    if (isRemovable) {
      this.removePointerInTextLayer(element)
    }

    const children = this.textChildren
    if (!children || children.length === 0) {
      return null
    }

    const index = binarySearchFirstItem(children, (node: Element) => compareElementPositions(element, node) < 0)
    const nodeIndex = Math.max(0, index - 1)
    const child = children[nodeIndex]

    addIdToAriaOwns(element.id, child)
    this.textNodes.set(element.id, nodeIndex)

    const parent = child.parentElement
    return parent?.classList.contains('markedContent') ? parent.id : null
  }

  moveElementInDOM(container: Element, element: Element, contentElement: Element, isRemovable: boolean) {
    const id = this.addPointerInTextLayer(contentElement, isRemovable)

    if (!container.hasChildNodes()) {
      container.append(element)
      return id
    }

    const children = Array.from(container.childNodes).filter(node => node !== element) as Element[]

    if (children.length === 0) {
      return id
    }

    const elementToCompare = contentElement || element
    const index = binarySearchFirstItem(children, (node: Element) => compareElementPositions(elementToCompare, node) < 0)

    if (index === 0) {
      children[0].before(element)
    } else {
      children[index - 1].after(element)
    }

    return id
  }
}

const addIdToAriaOwns = (id: string, node: Element) => {
  const owns = node.getAttribute('aria-owns')

  if (!owns?.includes(id)) {
    node.setAttribute('aria-owns', owns ? `${owns} ${id}` : id)
  }

  node.removeAttribute('role')
}

const compareElementPositions = (e1: Element, e2: Element) => {
  const rect1 = e1.getBoundingClientRect()
  const rect2 = e2.getBoundingClientRect()

  if (rect1.width === 0 && rect1.height === 0) {
    return +1
  }

  if (rect2.width === 0 && rect2.height === 0) {
    return -1
  }

  const top1 = rect1.y
  const bot1 = rect1.y + rect1.height
  const mid1 = rect1.y + rect1.height / 2
  const top2 = rect2.y
  const bot2 = rect2.y + rect2.height
  const mid2 = rect2.y + rect2.height / 2

  if (mid1 <= top2 && mid2 >= bot1) {
    return -1
  }

  if (mid2 <= top1 && mid1 >= bot2) {
    return +1
  }

  const centerX1 = rect1.x + rect1.width / 2
  const centerX2 = rect2.x + rect2.width / 2
  return centerX1 - centerX2
}
