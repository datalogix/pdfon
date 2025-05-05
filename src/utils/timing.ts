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
