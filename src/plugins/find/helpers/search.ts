import { binarySearchFirstItem } from '@/utils'

// Determine the original, non-normalized, match index such that highlighting of
// search results is correct in the `textLayer` for strings containing e.g. "½"
// characters; essentially "inverting" the result of the `normalize` function.
export function getOriginalIndex(diffs: number[][], pos: number, len: number) {
  if (!diffs) {
    return [pos, len]
  }

  // First char in the new string.
  const start = pos
  // Last char in the new string.
  const end = pos + len - 1
  let i = binarySearchFirstItem<number[]>(diffs, x => x[0] >= start)
  if (diffs[i][0] > start) {
    --i
  }

  let j = binarySearchFirstItem<number[]>(diffs, x => x[0] >= end, i)
  if (diffs[j][0] > end) {
    --j
  }

  // First char in the old string.
  const oldStart = start + diffs[i][1]

  // Last char in the old string.
  const oldEnd = end + diffs[j][1]
  const oldLen = oldEnd + 1 - oldStart

  return [oldStart, oldLen]
}
