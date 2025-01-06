import { PresentationModeState, RenderingStates } from '@/enums'
import { SidebarItem } from '@/toolbar'
import { createElement } from '@/utils'
import { ThumbnailViewer } from './thumbnail-viewer'

export class ThumbnailSidebarItem extends SidebarItem {
  protected thumbnailViewer?: ThumbnailViewer

  build() {
    const container = createElement('div', 'thumbnail-sidebar')

    this.thumbnailViewer = new ThumbnailViewer(container, this.viewer, this.signal)
    this.thumbnailViewer.setDocument(this.viewer.getDocument())

    this.viewer.renderManager.renderingQueue.registerHandler(() => {
      return this.opened && this.thumbnailViewer?.forceRendering()
    })

    this.on('pagesinit', ({ pdfDocument }) => this.thumbnailViewer?.setDocument(pdfDocument))
    this.on('pagesdestroy', () => this.thumbnailViewer?.destroy())
    this.on('pagechanging', ({ pageNumber }) => {
      if (this.opened) {
        this.thumbnailViewer?.scrollIntoView(pageNumber)
      }
    })

    this.on('pagerendered', ({ pageNumber }) => {
      const page = this.viewer.getPage(pageNumber - 1)

      if (this.opened && this.thumbnailViewer && page) {
        // this.thumbnailViewer.getThumbnail(pageNumber - 1).setImage(page)
      }
    })

    this.on('pagelabels', ({ labels }) => {
      if (this.thumbnailViewer) {
        this.thumbnailViewer.pageLabels = labels
      }
    })

    this.on('thumbnailrendered', ({ pageNumber }) => {
      const page = this.viewer.getPage(pageNumber - 1)

      if (!this.viewer.renderManager.buffer.has(page)) {
        page.pdfPage?.cleanup()
      }
    })

    this.on('rotationchanging', ({ rotation }) => {
      if (this.thumbnailViewer) {
        this.thumbnailViewer.rotation = rotation
      }
    })

    this.on('rendercleanup', () => this.thumbnailViewer?.cleanup())
    this.on('presentationmodechanged', ({ state }) => {
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
