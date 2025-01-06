export function debounce<T extends (...args: any[]) => void>(func: T, delay = 300): (...args: Parameters<T>) => void {
  let debounceTimeout: NodeJS.Timeout

  return function (...args: Parameters<T>): void {
    // Clear previous timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout)
    }

    // Set a new timeout
    debounceTimeout = setTimeout(() => {
      func(...args)
    }, delay)
  }
}

export function expose(obj: any, exposer: any, exclude?: string[]) {
  const prototype = Object.getPrototypeOf(exposer)
  const descriptors = Object.getOwnPropertyDescriptors(prototype)

  for (const key in descriptors) {
    if (exclude?.includes(key)) {
      continue
    }

    const descriptor = descriptors[key]

    if (descriptor.get || descriptor.set) {
      Object.defineProperty(obj, key, {
        ...descriptor,
        get: descriptor?.get ? () => exposer[key] : undefined,
        set: descriptor?.set ? (val) => { exposer[key] = val } : undefined,
      })
    } else if (typeof exposer[key] === 'function') {
      obj[key] = exposer[key].bind(exposer)
    }
  }
}

export function binarySearchFirstItem<T = Element>(items: T[], condition: (arg: T) => boolean, start = 0) {
  let minIndex = start
  let maxIndex = items.length - 1

  if (maxIndex < 0 || !condition(items[maxIndex])) {
    return items.length
  }

  if (condition(items[minIndex])) {
    return minIndex
  }

  while (minIndex < maxIndex) {
    const currentIndex = (minIndex + maxIndex) >> 1
    const currentItem = items[currentIndex]
    if (condition(currentItem)) {
      maxIndex = currentIndex
    } else {
      minIndex = currentIndex + 1
    }
  }

  return minIndex
}
