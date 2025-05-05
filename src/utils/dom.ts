import { name } from './helper'

export function preventDefault() {
  return (event: MouseEvent) => event.preventDefault()
}

export function isEmbedded() {
  return window.parent !== window
}

export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  classesOrAttributes?: string | string[] | Record<string, any>,
  attributes?: Record<string, any>,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag)
  let attrs = attributes || {}

  if (Array.isArray(classesOrAttributes)) {
    element.classList.add(...classesOrAttributes)
  } else if (typeof classesOrAttributes === 'string') {
    element.classList.add(classesOrAttributes)
  } else {
    attrs = Object.assign(attrs, classesOrAttributes || {})
  }

  for (const [key, value] of Object.entries(attrs)) {
    if (key in element) {
      (element as any)[key] = value
    } else {
      element.setAttribute(key, String(value))
    }
  }

  return element
}

export function dragElement(element: HTMLElement, options?: {
  parent?: HTMLElement
  handler?: HTMLElement
  threshold?: number
  onStart?: (event: MouseEvent | TouchEvent, x: number, y: number) => void
  onDrag?: (event: MouseEvent | TouchEvent, x: number, y: number) => void
  onStop?: (event: MouseEvent | TouchEvent, x: number, y: number) => void
}) {
  const handler = options?.handler ?? element
  let offsetX = 0
  let offsetY = 0
  let isDragging = false

  const onStart = (event: MouseEvent | TouchEvent) => {
    isDragging = false

    if (event instanceof TouchEvent) {
      offsetX = event.touches[0].clientX - element.offsetLeft
      offsetY = event.touches[0].clientY - element.offsetTop
      element.ownerDocument.addEventListener('touchmove', onDrag)
      element.ownerDocument.addEventListener('touchend', onStop)
    } else {
      offsetX = event.clientX - element.offsetLeft
      offsetY = event.clientY - element.offsetTop
      element.ownerDocument.addEventListener('mousemove', onDrag)
      element.ownerDocument.addEventListener('mouseup', onStop)
    }

    options?.onStart?.(event, offsetX, offsetY)
  }

  const onDrag = (event: MouseEvent | TouchEvent) => {
    let x = event instanceof TouchEvent ? event.touches[0].clientX - offsetX : event.clientX - offsetX
    let y = event instanceof TouchEvent ? event.touches[0].clientY - offsetY : event.clientY - offsetY
    const threshold = options?.threshold ?? 0

    if (
      threshold > 0
      && Math.sqrt((x - element.offsetLeft) ** 2 + (y - element.offsetTop) ** 2) < threshold
    ) {
      return
    }

    if (options?.parent) {
      const minX = options.parent.offsetLeft
      const maxX = minX + options.parent.offsetWidth
      const minY = options.parent.offsetTop
      const maxY = minY + options.parent.offsetHeight

      const clampedX = Math.max(minX, Math.min(x, maxX))
      const clampedY = Math.max(minY, Math.min(y, maxY))

      x = clampedX
      y = clampedY
    }

    isDragging = true
    element.style.position = 'absolute'
    element.style.left = `${x}px`
    element.style.top = `${y}px`

    options?.onDrag?.(event, x, y)
  }

  const onStop = (event: MouseEvent | TouchEvent) => {
    if (event instanceof TouchEvent) {
      element.ownerDocument.removeEventListener('touchmove', onDrag)
      element.ownerDocument.removeEventListener('touchend', onStop)
    } else {
      element.ownerDocument.removeEventListener('mousemove', onDrag)
      element.ownerDocument.removeEventListener('mouseup', onStop)
    }

    if (!isDragging) {
      return
    }

    const x = parseFloat(element.style.left)
    const y = parseFloat(element.style.top)

    options?.onStop?.(event, x, y)
  }

  handler.addEventListener('mousedown', onStart)
  handler.addEventListener('touchstart', onStart)
  handler.style.cursor = 'move'
  handler.style.userSelect = 'none'
  handler.oncontextmenu = preventDefault()
}

export function rootContainer(el?: HTMLDivElement | string) {
  let container = el instanceof HTMLDivElement ? el : (el ? document.getElementById(el) : null)

  if (!container) {
    container = document.body.appendChild(createElement('div'))
  }

  container.classList.add(name)
  container.tabIndex = 0

  return container
}
