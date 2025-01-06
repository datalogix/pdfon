import { DEFAULT_CACHE_SIZE } from '@/config'
import { SpreadMode, ScrollMode } from '@/enums'
import type { VisibleElements } from '@/utils'
import type { Page } from '../page'
import { Renderable, RenderingQueue, Buffer } from '../rendering'
import { Manager } from './'

export class RenderManager extends Manager implements Renderable {
  private _renderingQueue = new RenderingQueue(this, this.cleanup)
  readonly buffer = new Buffer<Page>(DEFAULT_CACHE_SIZE)

  get renderingQueue() {
    return this._renderingQueue
  }

  reset() {
    this.cancelRendering()
    this.buffer.reset()
  }

  update(visible: VisibleElements) {
    const newCacheSize = Math.max(DEFAULT_CACHE_SIZE, 2 * visible.views.length + 1)

    this.buffer.resize(newCacheSize, visible.ids)
    this.renderingQueue.renderHighestPriority(visible)
  }

  getCachedPages() {
    return new Set(this.buffer)
  }

  cleanup() {
    if (!this.pdfDocument) {
      return
    }

    for (const page of this.pages) {
      if (!page.isRenderingFinished) {
        page.reset()
      }
    }

    this.pdfDocument.cleanup()
    this.dispatch('rendercleanup')
  }

  cancelRendering() {
    for (const page of this.pages) {
      page.cancelRendering()
    }
  }

  private async ensurePdfPageLoaded(page: Page) {
    if (!this.pdfDocument) {
      return
    }

    if (page.pdfPage) {
      return page.pdfPage
    }

    try {
      const pdfPage = await this.pdfDocument.getPage(page.id)

      if (!page.pdfPage) {
        page.setPdfPage(pdfPage)
      }

      return pdfPage
    } catch (reason) {
      this.logger.error('Unable to get page for page view', reason)
      return null
    }
  }

  forceRendering(currentlyVisiblePages?: VisibleElements) {
    const visiblePages = currentlyVisiblePages || this.scrollManager.getVisiblePages()
    const scrollAhead = this.scrollManager.getScrollAhead(visiblePages)
    const preRenderExtra = this.spreadMode !== SpreadMode.NONE && this.scrollMode !== ScrollMode.HORIZONTAL
    const page = this.renderingQueue.getHighestPriority(visiblePages, this.pages, scrollAhead, preRenderExtra)

    if (!page) {
      return false
    }

    this.ensurePdfPageLoaded(page as Page)
      .then(() => this.renderingQueue.renderView(page))
      .catch(reason => this.logger.error(this.l10n.get('error.rendering'), reason))

    return true
  }
}
