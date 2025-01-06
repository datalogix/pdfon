export function isPortraitOrientation(size: { width: number, height: number }) {
  return size.width <= size.height
}
