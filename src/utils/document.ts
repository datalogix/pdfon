import { AnnotationEditorType, AnnotationMode, GlobalWorkerOptions, PageViewport, PermissionFlag } from '@/pdfjs'
import { ScrollMode, SpreadMode, TextLayerMode } from '@/enums'
import { PageColors } from '@/viewer'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import workerSrc from 'pdfjs-dist/build/pdf.worker?url'

export function defineWorker() {
  if (GlobalWorkerOptions.workerSrc) {
    return
  }

  GlobalWorkerOptions.workerSrc = workerSrc
}

export function updateLayerDimensions(
  div: HTMLElement,
  viewport: PageViewport,
  mustFlip = false,
  mustRotate = true,
) {
  const { pageWidth, pageHeight } = viewport.rawDims as { pageWidth: number, pageHeight: number }
  const { style } = div

  const w = `var(--scale-factor) * ${pageWidth}px`
  const h = `var(--scale-factor) * ${pageHeight}px`
  const widthStr = `round(down, ${w}, var(--scale-round-x, 1px))`
  const heightStr = `round(down, ${h}, var(--scale-round-y, 1px))`

  if (!mustFlip || viewport.rotation % 180 === 0) {
    style.width = widthStr
    style.height = heightStr
  } else {
    style.width = heightStr
    style.height = widthStr
  }

  if (mustRotate) {
    div.setAttribute('data-main-rotation', viewport.rotation.toString())
  }
}

export function apiPageLayoutToViewerModes(layout: string) {
  let scrollMode = ScrollMode.VERTICAL
  let spreadMode = SpreadMode.NONE

  switch (layout) {
    case 'SinglePage':
      scrollMode = ScrollMode.PAGE
      break

    case 'OneColumn':
      break

    case 'TwoPageLeft':
      scrollMode = ScrollMode.PAGE
      spreadMode = SpreadMode.ODD
      break

    case 'TwoColumnLeft':
      spreadMode = SpreadMode.ODD
      break

    case 'TwoPageRight':
      scrollMode = ScrollMode.PAGE
      spreadMode = SpreadMode.EVEN
      break

    case 'TwoColumnRight':
      spreadMode = SpreadMode.EVEN
      break
  }

  return { scrollMode, spreadMode }
}

export function initializePermissions(permissions?: number[], defaults: {
  annotationEditorMode?: number
  annotationMode?: number
  textLayerMode?: TextLayerMode
} = {}) {
  const params = {
    annotationEditorMode: defaults.annotationEditorMode ?? AnnotationEditorType.NONE,
    annotationMode: defaults.annotationMode ?? AnnotationMode.ENABLE_FORMS,
    textLayerMode: defaults.textLayerMode ?? TextLayerMode.ENABLE,
  }

  if (!permissions) {
    return params
  }

  if (!permissions.includes(PermissionFlag.COPY) && params.textLayerMode === TextLayerMode.ENABLE) {
    params.textLayerMode = TextLayerMode.ENABLE_PERMISSIONS
  }

  if (!permissions.includes(PermissionFlag.MODIFY_CONTENTS)) {
    params.annotationEditorMode = AnnotationEditorType.DISABLE
  }

  if (
    !permissions.includes(PermissionFlag.MODIFY_ANNOTATIONS)
    && !permissions.includes(PermissionFlag.FILL_INTERACTIVE_FORMS)
    && params.annotationMode === AnnotationMode.ENABLE_FORMS
  ) {
    params.annotationMode = AnnotationMode.ENABLE
  }

  return params
}

export function resolvePageColors() {
  return window.matchMedia('(forced-colors: active)').matches
    ? {
        background: 'Canvas',
        foreground: 'CanvasText',
      }
    : undefined
}

export function applyHighlightHCMFilter(container: HTMLElement, pageColors?: PageColors, filterFactory?: any) {
  if (!filterFactory) {
    return
  }

  if (!(pageColors?.foreground === 'CanvasText' || pageColors?.background === 'Canvas')) {
    return
  }

  container.style.setProperty(
    '--hcm-highlight-filter',
    filterFactory.addHighlightHCMFilter(
      'highlight',
      'CanvasText',
      'Canvas',
      'HighlightText',
      'Highlight',
    ),
  )

  container.style.setProperty(
    '--hcm-highlight-selected-filter',
    filterFactory.addHighlightHCMFilter(
      'highlight_selected',
      'CanvasText',
      'Canvas',
      'HighlightText',
      'Highlight',
      'ButtonText',
    ),
  )
}
