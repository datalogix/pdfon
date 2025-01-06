export function scrollIntoView(
  element: HTMLElement,
  spot?: { top?: number, left?: number },
  scrollMatches?: boolean,
) {
  let parent = element.offsetParent as HTMLElement

  if (!parent) {
    return
  }

  let offsetY = element.offsetTop
  let offsetX = element.offsetLeft

  while (
    parent.classList.contains('page')
    || (parent.clientHeight === parent.scrollHeight
      && parent.clientWidth === parent.scrollWidth)
    || (scrollMatches
      && (parent.classList.contains('markedContent')
        || getComputedStyle(parent).overflow === 'hidden'))
  ) {
    offsetY += parent.offsetTop
    offsetX += parent.offsetLeft
    parent = parent.offsetParent as HTMLElement

    if (!parent) {
      return
    }
  }

  if (spot) {
    if (spot.top !== undefined) {
      offsetY += spot.top
    }
    if (spot.left !== undefined) {
      offsetX += spot.left
      parent.scrollLeft = offsetX
    }
  }

  parent.scrollTop = offsetY
}

type ScrollState = {
  right: boolean
  down: boolean
  lastX: number
  lastY: number
  _eventHandler: (event: Event) => void
}

export function watchScroll(viewAreaElement: HTMLElement, callback: (state: ScrollState) => void, abortSignal?: AbortSignal) {
  let rAF: number | null = null

  const debounceScroll = function (_event: Event) {
    if (rAF) {
      return
    }

    // schedule an invocation of scroll for next animation frame.
    rAF = window.requestAnimationFrame(() => {
      rAF = null

      const currentX = viewAreaElement.scrollLeft
      const lastX = state.lastX
      if (currentX !== lastX) {
        state.right = currentX > lastX
      }
      state.lastX = currentX
      const currentY = viewAreaElement.scrollTop
      const lastY = state.lastY
      if (currentY !== lastY) {
        state.down = currentY > lastY
      }
      state.lastY = currentY
      callback(state)
    })
  }

  const state: ScrollState = {
    right: true,
    down: true,
    lastX: viewAreaElement.scrollLeft,
    lastY: viewAreaElement.scrollTop,
    _eventHandler: debounceScroll,
  }

  viewAreaElement.addEventListener('scroll', debounceScroll, {
    capture: true,
    signal: abortSignal,
  })

  return state
}
