// Determine the original, non-normalized, match index such that highlighting of
// search results is correct in the `textLayer` for strings containing e.g. "½"
// characters; essentially "inverting" the result of the `normalize` function.
export function getOriginalIndex<T extends number>(diffs: T[][], pos: T, len: T) {
  if (!diffs) {
    return [pos, len]
  }

  const [starts, shifts] = diffs
  // First char in the new string.
  const start = pos
  // Last char in the new string.
  const end = pos + len - 1
  let i = binarySearchFirstItem(starts, x => x >= start)
  if (starts[i] > start) {
    --i
  }

  let j = binarySearchFirstItem(starts, x => x >= end, i)
  if (starts[j] > end) {
    --j
  }

  // First char in the old string.
  const oldStart = start + shifts[i]

  // Last char in the old string.
  const oldEnd = end + shifts[j]
  const oldLen = oldEnd + 1 - oldStart

  return [oldStart, oldLen]
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
