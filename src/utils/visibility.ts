import { IRenderableView } from '@/pdfjs'
import { binarySearchFirstItem } from './helper'

export type VisibleView = IRenderableView & {
  id: number
  div: HTMLElement
}

export type VisibleElement = {
  id: number
  x: number
  y: number
  view: VisibleView
  percent: number
  widthPercent: number
}

export type VisibleElements = {
  first?: VisibleElement
  last?: VisibleElement
  views: VisibleElement[]
  ids: Set<number>
}

export function getVisibleElements(
  scrollEl: HTMLElement,
  views: VisibleView[],
  sortByVisibility?: boolean,
  horizontal?: boolean,
  rtl?: boolean,
): VisibleElements {
  const top = scrollEl.scrollTop
  const bottom = top + scrollEl.clientHeight
  const left = scrollEl.scrollLeft
  const right = left + scrollEl.clientWidth

  function isElementBottomAfterViewTop(view: VisibleView) {
    const element = view.div
    const elementBottom = element.offsetTop/* + element.clientTop */ + element.clientHeight
    return elementBottom > top
  }

  function isElementNextAfterViewHorizontally(view: VisibleView) {
    const element = view.div
    const elementLeft = element.offsetLeft/* + element.clientLeft */
    const elementRight = elementLeft + element.clientWidth
    return rtl ? elementLeft < right : elementRight > left
  }

  function backtrackBeforeAllVisibleElements(index: number, views: VisibleView[], top: number) {
    if (index < 2) return index

    let elt = views[index].div
    let pageTop = elt.offsetTop/* + elt.clientTop */

    if (pageTop >= top) {
      elt = views[index - 1].div
      pageTop = elt.offsetTop/* + elt.clientTop */
    }

    for (let i = index - 2; i >= 0; --i) {
      elt = views[i].div

      if (elt.offsetTop/* + elt.clientTop */ + elt.clientHeight <= pageTop) {
        break
      }

      index = i
    }

    return index
  }

  const visible = []
  const ids = new Set<number>()
  const numViews = views.length

  let firstVisibleElementInd = binarySearchFirstItem<VisibleView>(
    views,
    horizontal
      ? isElementNextAfterViewHorizontally
      : isElementBottomAfterViewTop,
  )

  if (
    firstVisibleElementInd > 0
    && firstVisibleElementInd < numViews
    && !horizontal
  ) {
    firstVisibleElementInd = backtrackBeforeAllVisibleElements(
      firstVisibleElementInd,
      views,
      top,
    )
  }

  let lastEdge = horizontal ? right : -1

  for (let i = firstVisibleElementInd; i < numViews; i++) {
    const view = views[i]
    const element = view.div
    const currentWidth = element.offsetLeft/* + element.clientLeft */ - scrollEl.offsetLeft
    const currentHeight = element.offsetTop/* + element.clientTop */ - scrollEl.offsetTop
    const viewWidth = element.clientWidth
    const viewHeight = element.clientHeight
    const viewRight = currentWidth + viewWidth
    const viewBottom = currentHeight + viewHeight

    if (lastEdge === -1) {
      if (viewBottom >= bottom) {
        lastEdge = viewBottom
      }
    } else if ((horizontal ? currentWidth : currentHeight) > lastEdge) {
      break
    }

    if (
      viewBottom <= top
      || currentHeight >= bottom
      || viewRight <= left
      || currentWidth >= right
    ) {
      continue
    }

    const hiddenHeight = Math.max(0, top - currentHeight) + Math.max(0, viewBottom - bottom)
    const hiddenWidth = Math.max(0, left - currentWidth) + Math.max(0, viewRight - right)
    const fractionHeight = (viewHeight - hiddenHeight) / viewHeight
    const fractionWidth = (viewWidth - hiddenWidth) / viewWidth
    const percent = (fractionHeight * fractionWidth * 100) | 0

    visible.push({
      id: view.id,
      x: currentWidth,
      y: currentHeight,
      view,
      percent,
      widthPercent: (fractionWidth * 100) | 0,
    })

    ids.add(view.id)
  }

  const first = visible[0]
  const last = visible.at(-1)

  if (sortByVisibility) {
    visible.sort((a, b) => {
      const pc = a.percent - b.percent
      return (Math.abs(pc) > 0.001) ? -pc : a.id - b.id
    })
  }

  return { first, last, views: visible, ids }
}

export async function onePageRenderedOrForceFetch(
  container: HTMLElement,
  visibleElements: VisibleElements,
  onePageRenderedCapability: Promise<{ timestamp: number }>,
  signal: AbortSignal,
) {
  if (document.visibilityState === 'hidden'
    || !container.offsetParent
    || visibleElements.views.length === 0
  ) {
    return
  }

  const hiddenCapability = Promise.withResolvers<void>()

  function onVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      hiddenCapability.resolve()
    }
  }

  document.addEventListener('visibilitychange', onVisibilityChange, { signal })
  await Promise.race([onePageRenderedCapability, hiddenCapability.promise])
  document.removeEventListener('visibilitychange', onVisibilityChange)
}
