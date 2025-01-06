import { createElement } from '@/utils'

export function reduceImage(
  img: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D | null,
  canvas: HTMLCanvasElement,
  scalingSteps = 3,
) {
  if (img.width <= 2 * canvas.width) {
    ctx?.drawImage(
      img,
      0,
      0,
      img.width,
      img.height,
      0,
      0,
      canvas.width,
      canvas.height,
    )
    return canvas
  }

  let reducedWidth = canvas.width << scalingSteps
  let reducedHeight = canvas.height << scalingSteps

  const [reducedImage, reducedImageCtx] = createTempCanvas(reducedWidth, reducedHeight)

  while (reducedWidth > img.width || reducedHeight > img.height) {
    reducedWidth >>= 1
    reducedHeight >>= 1
  }

  reducedImageCtx.drawImage(
    img,
    0,
    0,
    img.width,
    img.height,
    0,
    0,
    reducedWidth,
    reducedHeight,
  )

  while (reducedWidth > 2 * canvas.width) {
    reducedImageCtx.drawImage(
      reducedImage,
      0,
      0,
      reducedWidth,
      reducedHeight,
      0,
      0,
      reducedWidth >> 1,
      reducedHeight >> 1,
    )

    reducedWidth >>= 1
    reducedHeight >>= 1
  }

  ctx?.drawImage(
    reducedImage,
    0,
    0,
    reducedWidth,
    reducedHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  )

  return canvas
}

export function createScaledCanvasContext(width: number, height: number, upscaleFactor = 1, enableHWA?: boolean) {
  const canvas = createElement('canvas')
  const ctx = canvas.getContext('2d', {
    alpha: false,
    willReadFrequently: !enableHWA,
  })

  const outputScale = {
    sx: window.devicePixelRatio || 1,
    sy: window.devicePixelRatio || 1,
  }

  canvas.width = (upscaleFactor * width * outputScale.sx) | 0
  canvas.height = (upscaleFactor * height * outputScale.sy) | 0

  const transform = outputScale.sx !== 1 || outputScale.sy !== 1
    ? [outputScale.sx, 0, 0, outputScale.sy, 0, 0]
    : undefined

  return { ctx, canvas, transform }
}

let tempCanvas: HTMLCanvasElement | undefined

function createTempCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  tempCanvas = tempCanvas || createElement('canvas')
  tempCanvas.width = width
  tempCanvas.height = height

  const ctx = tempCanvas.getContext('2d', { alpha: false })

  if (ctx) {
    ctx.save()
    ctx.fillStyle = 'rgb(255, 255, 255)'
    ctx.fillRect(0, 0, width, height)
    ctx.restore()
  }

  return [tempCanvas, tempCanvas.getContext('2d')!]
}

export function destroyTempCanvas() {
  if (tempCanvas) {
    tempCanvas.width = 0
    tempCanvas.height = 0
    tempCanvas = undefined
  }
}
