import { PresentationModeState, RenderingStates } from '@/enums'
import { createElement } from '@/utils'
import { SidebarItem } from '../sidebar'
import { ThumbnailViewer } from './thumbnail-viewer'
import type { ThumbnailPlugin } from './thumbnail-plugin'

export class ThumbnailSidebarItem extends SidebarItem {
  protected thumbnailViewer?: ThumbnailViewer

  get thumbnailPlugin() {
    return this.viewer.getLayerProperty<ThumbnailPlugin>('ThumbnailPlugin')!
  }

  get order() {
    return 1
  }

  build() {
    const container = createElement('div', 'thumbnail-sidebar')

    this.thumbnailViewer = new ThumbnailViewer(
      container,
      this.viewer,
      this.thumbnailPlugin.translator,
      this.signal,
    )
    this.thumbnailViewer.setDocument(this.viewer.getDocument())

    this.viewer.renderManager.renderingQueue.registerHandler(() => {
      return this.opened && this.thumbnailViewer?.forceRendering()
    })

    this.on('PagesInit', ({ pdfDocument }) => this.thumbnailViewer?.setDocument(pdfDocument))
    this.on('PagesDestroy', () => this.thumbnailViewer?.destroy())
    this.on('PageChanging', ({ pageNumber }) => {
      if (this.opened) {
        this.thumbnailViewer?.scrollIntoView(pageNumber)
      }
    })

    this.on('PageRendered', ({ pageNumber }) => {
      const page = this.viewer.getPage(pageNumber - 1)

      if (this.opened && this.thumbnailViewer && page) {
        // this.thumbnailViewer.getThumbnail(pageNumber - 1).setImage(page)
      }
    })

    this.on('PageLabels', ({ labels }) => {
      if (this.thumbnailViewer) {
        this.thumbnailViewer.pageLabels = labels
      }
    })

    this.on('ThumbnailRendered', ({ pageNumber }) => {
      const page = this.viewer.getPage(pageNumber - 1)

      if (!this.viewer.renderManager.buffer.has(page)) {
        page.pdfPage?.cleanup()
      }
    })

    this.on('RotationChanging', ({ rotation }) => {
      if (this.thumbnailViewer) {
        this.thumbnailViewer.rotation = rotation
      }
    })

    this.on('RenderCleanup', () => this.thumbnailViewer?.cleanup())
    this.on('PresentationModeChanged', ({ state }) => {
      if (this.opened && state === PresentationModeState.NORMAL) {
        this.update()
      }
    })

    return container
  }

  update() {
    if (!this.thumbnailViewer) return

    for (const page of this.viewer.getCachedPages()) {
      if (page.renderingState === RenderingStates.FINISHED) {
        this.thumbnailViewer.getThumbnail(page.id - 1)?.setImage(page)
      }
    }

    this.thumbnailViewer.scrollIntoView(this.viewer.currentPageNumber)
  }

  show() {
    super.show()

    queueMicrotask(() => this.update())
  }

  protected destroy() {
    this.thumbnailViewer?.destroy()
    this.thumbnailViewer = undefined
  }
}
