import { EventBus } from '@/bus'

export async function waitOnEventOrTimeout(target: Element | EventBus, name: string, delay = 0) {
  const { promise, resolve } = Promise.withResolvers<'event' | 'timeout'>()
  const abortController = new AbortController()

  const handler = (type: 'event' | 'timeout') => {
    abortController.abort()
    clearTimeout(timeout)
    resolve(type)
  }

  if (target instanceof EventBus) {
    target.on(name, handler.bind(null, 'event'), {
      signal: abortController.signal,
    })
  } else {
    target.addEventListener(name, handler.bind(null, 'event'), {
      signal: abortController.signal,
    })
  }

  const timeout = setTimeout(handler.bind(null, 'timeout'), delay)

  return promise
}

export function normalizeWheelEventDirection(event: WheelEvent) {
  let delta = Math.hypot(event.deltaX, event.deltaY)
  const angle = Math.atan2(event.deltaY, event.deltaX)

  if (-0.25 * Math.PI < angle && angle < 0.75 * Math.PI) {
    // All that is left-up oriented has to change the sign.
    delta = -delta
  }

  return delta
}

export function normalizeWheelEventDelta(event: WheelEvent) {
  const deltaMode = event.deltaMode // Avoid being affected by bug 1392460.
  let delta = normalizeWheelEventDirection(event)

  const MOUSE_PIXELS_PER_LINE = 30
  const MOUSE_LINES_PER_PAGE = 30

  // Converts delta to per-page units
  if (deltaMode === WheelEvent.DOM_DELTA_PIXEL) {
    delta /= MOUSE_PIXELS_PER_LINE * MOUSE_LINES_PER_PAGE
  } else if (deltaMode === WheelEvent.DOM_DELTA_LINE) {
    delta /= MOUSE_LINES_PER_PAGE
  }

  return delta
}

export function dispatchEvent(name: string, target: EventTarget = window) {
  target.dispatchEvent(new CustomEvent(name, {
    bubbles: false,
    cancelable: false,
    detail: 'custom',
  }))
}
