const PRECISION = 1e-1

export class CaretBrowsingMode {
  private toolBarHeight: number

  constructor(
    public readonly mainContainer?: HTMLElement,
    public readonly viewerContainer?: HTMLElement,
    public readonly toolbarContainer?: HTMLElement,
  ) {
    this.toolBarHeight = toolbarContainer?.getBoundingClientRect().height ?? 0
  }

  private isOnSameLine(rect1: DOMRect, rect2: DOMRect) {
    const top1 = rect1.y
    const bot1 = rect1.bottom
    const mid1 = rect1.y + rect1.height / 2

    const top2 = rect2.y
    const bot2 = rect2.bottom
    const mid2 = rect2.y + rect2.height / 2

    return (top1 <= mid2 && mid2 <= bot1) || (top2 <= mid1 && mid1 <= bot2)
  }

  private isUnderOver(rect: DOMRect, x: number, y: number, isUp: boolean = false) {
    const midY = rect.y + rect.height / 2

    return (
      (isUp ? y >= midY : y <= midY)
      && rect.x - PRECISION <= x
      && x <= rect.right + PRECISION
    )
  }

  private isVisible(rect: DOMRect) {
    return (
      rect.top >= this.toolBarHeight
      && rect.left >= 0
      && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
      && rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    )
  }

  private getCaretPosition(selection: Selection, isUp: boolean = false) {
    const { focusNode, focusOffset } = selection
    const range = document.createRange()

    range.setStart(focusNode!, focusOffset)
    range.setEnd(focusNode!, focusOffset)

    const rect = range.getBoundingClientRect()
    return [rect.x, isUp ? rect.top : rect.bottom]
  }

  static caretPositionFromPoint(x: number, y: number) {
    // @ts-ignore
    return document.caretPositionFromPoint(x, y)
  }

  private setCaretPositionHelper(
    selection: Selection,
    caretX: number,
    select: boolean,
    element: Element,
    rect?: DOMRect,
  ) {
    rect ||= element.getBoundingClientRect()

    if (caretX <= rect.x + PRECISION) {
      if (select) {
        selection.extend(element.firstChild!, 0)
      }
      else {
        selection.setPosition(element.firstChild, 0)
      }
      return
    }

    if (rect.right - PRECISION <= caretX) {
      const { lastChild } = element
      if (select) {
        selection.extend(lastChild!, lastChild?.length)
      }
      else {
        selection.setPosition(lastChild, lastChild?.length)
      }
      return
    }

    const midY = rect.y + rect.height / 2
    let caretPosition = CaretBrowsingMode.caretPositionFromPoint(caretX, midY)
    let parentElement = caretPosition.offsetNode?.parentElement

    if (parentElement && parentElement !== element) {
      const elementsAtPoint = document.elementsFromPoint(caretX, midY)
      const savedVisibilities = []

      for (const el of elementsAtPoint) {
        if (el === element) {
          break
        }

        const style = (el as HTMLElement).style
        savedVisibilities.push([el, style.visibility])
        style.visibility = 'hidden'
      }

      caretPosition = CaretBrowsingMode.caretPositionFromPoint(caretX, midY)
      parentElement = caretPosition.offsetNode?.parentElement

      for (const [el, visibility] of savedVisibilities) {
        (el as HTMLElement).style.visibility = String(visibility)
      }
    }

    if (parentElement !== element) {
      if (select) {
        selection.extend(element.firstChild!, 0)
      }
      else {
        selection.setPosition(element.firstChild, 0)
      }
      return
    }

    if (select) {
      selection.extend(caretPosition.offsetNode, caretPosition.offset)
    }
    else {
      selection.setPosition(caretPosition.offsetNode, caretPosition.offset)
    }
  }

  private setCaretPosition(
    select: boolean,
    selection: Selection,
    newLineElement: Element,
    newLineElementRect: DOMRect,
    caretX: number,
  ) {
    if (this.isVisible(newLineElementRect)) {
      this.setCaretPositionHelper(
        selection,
        caretX,
        select,
        newLineElement,
        newLineElementRect,
      )
      return
    }

    this.mainContainer?.addEventListener(
      'scrollend',
      this.setCaretPositionHelper.bind(
        this,
        selection,
        caretX,
        select,
        newLineElement,
        undefined,
      ),
      { once: true },
    )

    newLineElement.scrollIntoView()
  }

  private getNodeOnNextPage(textLayer: Element, isUp: boolean = false) {
    while (true) {
      const page = textLayer.closest('.page')
      const pageNumber = parseInt(page?.getAttribute('data-page-number') ?? '')
      const nextPage = isUp ? pageNumber - 1 : pageNumber + 1
      const element = this.viewerContainer?.querySelector(`.page[data-page-number="${nextPage}"] .textLayer`)

      if (!element) {
        return null
      }

      textLayer = element

      const walker = document.createTreeWalker(textLayer, NodeFilter.SHOW_TEXT)
      const node = isUp ? walker.lastChild() : walker.firstChild()

      if (node) {
        return node
      }
    }
  }

  moveCaret(isUp: boolean, select: boolean) {
    const selection = document.getSelection()

    if (!selection || selection.rangeCount === 0 || !selection.focusNode) {
      return
    }
    const focusElement = (selection.focusNode.nodeType !== Node.ELEMENT_NODE
      ? selection.focusNode.parentElement
      : selection.focusNode) as HTMLElement

    const root = focusElement.closest('.textLayer')

    if (!root) {
      return
    }

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    walker.currentNode = selection.focusNode

    const focusRect = focusElement.getBoundingClientRect()
    let newLineElement = null

    const nodeIterator = (isUp ? walker.previousSibling : walker.nextSibling).bind(walker)

    while (nodeIterator()) {
      const element = walker.currentNode.parentElement!

      if (!this.isOnSameLine(focusRect, element.getBoundingClientRect())) {
        newLineElement = element
        break
      }
    }

    if (!newLineElement) {
      const node = this.getNodeOnNextPage(root, isUp)
      if (!node) return

      if (select) {
        const lastNode = (isUp ? walker.firstChild() : walker.lastChild()) || selection.focusNode
        selection.extend(lastNode, isUp ? 0 : lastNode.length)
        const range = document.createRange()
        range.setStart(node, isUp ? node.length : 0)
        range.setEnd(node, isUp ? node.length : 0)
        selection.addRange(range)
        return
      }

      const [caretX] = this.getCaretPosition(selection, isUp)

      this.setCaretPosition(
        select,
        selection,
        node.parentElement!,
        node.parentElement!.getBoundingClientRect(),
        caretX,
      )
      return
    }

    const [caretX, caretY] = this.getCaretPosition(selection, isUp)
    const newLineElementRect = newLineElement.getBoundingClientRect()

    if (this.isUnderOver(newLineElementRect, caretX, caretY, isUp)) {
      this.setCaretPosition(
        select,
        selection,
        newLineElement,
        newLineElementRect,
        caretX,
      )

      return
    }

    while (nodeIterator()) {
      const element = walker.currentNode.parentElement!
      const elementRect = element.getBoundingClientRect()

      if (!this.isOnSameLine(newLineElementRect, elementRect)) {
        break
      }

      if (this.isUnderOver(elementRect, caretX, caretY, isUp)) {
        this.setCaretPosition(select, selection, element, elementRect, caretX)
        return
      }
    }

    this.setCaretPosition(
      select,
      selection,
      newLineElement,
      newLineElementRect,
      caretX,
    )
  }
}
