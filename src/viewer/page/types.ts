import type { EventBus } from '@/bus'
import type { TextLayerMode } from '@/enums'
import type { IL10n } from '@/l10n'
import * as pdfjs from '@/pdfjs'
import type { LayerBuilderType } from '../layers'
import * as managers from '../managers'
import type { RenderingQueue } from '../rendering'
import type { Logger } from '../logger'

export type PageColors = {
  background: 'Canvas' | string
  foreground: 'CanvasText' | string
}

export type PageOptions = {
  id: number
  viewport: pdfjs.PageViewport
  eventBus: EventBus
  l10n: IL10n
  logger: Logger
  container?: HTMLElement
  scale?: number
  rotation?: number
  optionalContentConfigPromise?: Promise<pdfjs.OptionalContentConfig>
  renderingQueue?: RenderingQueue
  maxCanvasPixels?: number
  textLayerMode?: TextLayerMode
  imageResourcesPath?: string
  annotationMode?: number
  layerBuilders?: LayerBuilderType[]
  layerProperties: managers.LayerPropertiesManager
  enableHWA?: boolean
  pageColors?: PageColors
  isStandalone?: boolean
}

export type PageUpdate = {
  scale?: number
  rotation?: number
  optionalContentConfigPromise?: Promise<pdfjs.OptionalContentConfig>
  drawingDelay?: number
}
