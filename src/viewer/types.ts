import type { EventBus } from '@/bus'
import type { TextLayerMode } from '@/enums'
import type { IL10n } from '@/l10n'
import type { PageColors, Viewer } from '../viewer'
import * as managers from './managers'

export type ViewerOptions = {
  eventBus?: EventBus
  l10n?: IL10n
  container?: HTMLDivElement
  abortSignal?: AbortSignal
  textLayerMode?: TextLayerMode
  enablePermissions?: boolean
  removePageBorders?: boolean
  imageResourcesPath?: string
  maxCanvasPixels?: number
  annotationMode?: number
  annotationEditorMode?: number
  annotationEditorHighlightColors?: string
  enableHighlightFloatingButton?: boolean
  enablePrintAutoRotate?: boolean
  enableHWA?: boolean
  pageColors?: PageColors
}

export type ViewerType = Viewer &
  managers.AnnotationManager &
  managers.ContainerManager &
  managers.DocumentManager &
  managers.DocumentPropertiesManager &
  managers.InitializerManager &
  managers.LayerBuildersManager &
  managers.LayerPropertiesManager &
  managers.LocationManager &
  managers.OptionalContentManager &
  managers.PageLabelsManager &
  managers.PagesManager &
  managers.PresentationManager &
  managers.RenderManager &
  managers.RotationManager &
  managers.ScaleManager &
  managers.ScrollManager &
  managers.SpreadManager
