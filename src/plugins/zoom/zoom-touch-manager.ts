import { TouchManager } from '@/pdfjs'

export class ZoomTouchManager extends TouchManager {
  constructor(options: Partial<{
    container: HTMLElement
    isPinchingDisabled: () => boolean
    isPinchingStopped: () => boolean
    onPinchStart: () => void
    onPinching: (origin: number[], prevDistance: number, distance: number) => void
    onPinchEnd: () => void
    signal: AbortSignal
  }>) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    super(options)
  }
}
