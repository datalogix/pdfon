import { MAX_CANVAS_DIM, MAX_CANVAS_PIXELS } from '@/config'
import { OutputScale } from '@/pdfjs'
import { createElement } from '@/utils'

let tempCanvas: HTMLCanvasElement | undefined

export function createTempCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
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

export function getPageDrawContext(
  canvasWidth: number,
  canvasHeight: number,
  upscaleFactor: number,
  enableHWA?: boolean,
  maxCanvasPixels = MAX_CANVAS_PIXELS,
  maxCanvasDim = MAX_CANVAS_DIM,
) {
  const canvas = createElement('canvas')
  const ctx = canvas.getContext('2d', {
    alpha: false,
    willReadFrequently: !enableHWA,
  })

  const outputScale = new OutputScale()
  const width = upscaleFactor * canvasWidth
  const height = upscaleFactor * canvasHeight

  outputScale.limitCanvas(
    width,
    height,
    maxCanvasPixels,
    maxCanvasDim,
  )
  canvas.width = (width * outputScale.sx) | 0
  canvas.height = (height * outputScale.sy) | 0

  const transform = outputScale.scaled
    ? [outputScale.sx, 0, 0, outputScale.sy, 0, 0]
    : null

  return { ctx, canvas, transform }
}

export function reduceImage(
  img: HTMLCanvasElement,
  canvasWidth: number,
  canvasHeight: number,
  scalingSteps = 3,
  maxCanvasPixels = MAX_CANVAS_PIXELS,
  maxCanvasDim = MAX_CANVAS_DIM,
) {
  const { ctx, canvas } = getPageDrawContext(
    canvasWidth,
    canvasHeight,
    1,
    true,
    maxCanvasPixels,
    maxCanvasDim,
  )

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

  let [reducedWidth, reducedHeight] = getReducedImageDims(
    canvas,
    scalingSteps,
    maxCanvasPixels,
    maxCanvasDim,
  )

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

function getReducedImageDims(
  canvas: HTMLCanvasElement,
  scalingSteps = 3,
  maxCanvasPixels = MAX_CANVAS_PIXELS,
  maxCanvasDim = MAX_CANVAS_DIM,
) {
  const width = canvas.width << scalingSteps
  const height = canvas.height << scalingSteps

  const outputScale = new OutputScale()
  // Here we're not actually "rendering" to the canvas and the `OutputScale`
  // is thus only used to limit the canvas size, hence the identity scale.
  outputScale.sx = outputScale.sy = 1

  outputScale.limitCanvas(
    width,
    height,
    maxCanvasPixels,
    maxCanvasDim,
  )
  return [(width * outputScale.sx) | 0, (height * outputScale.sy) | 0]
}
