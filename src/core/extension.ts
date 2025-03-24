import { Dispatcher } from '@/bus'
import type { Toolbar } from '@/toolbar'
import type { ViewerType } from '@/viewer'

export abstract class Extension extends Dispatcher {
  private _toolbar?: Toolbar
  private _viewer?: ViewerType

  get toolbar() {
    return this._toolbar!
  }

  get viewer() {
    return this._viewer!
  }

  get options() {
    return this.viewer.options
  }

  get eventBus() {
    return this.viewer.eventBus
  }

  get signal() {
    return this.options.abortSignal
  }

  get l10n() {
    return this.viewer.l10n
  }

  get logger() {
    return this.viewer.logger
  }

  get pdfDocument() {
    return this.viewer.getDocument()
  }

  get rootContainer() {
    return this.viewer.rootContainer
  }

  get viewerContainer() {
    return this.viewer.viewerContainer
  }

  get pagesCount() {
    return this.viewer.pagesCount
  }

  get page() {
    return this.viewer.currentPageNumber
  }

  set page(val: number) {
    this.viewer.currentPageNumber = val
  }

  setToolbar(toolbar: Toolbar) {
    this._toolbar = toolbar
  }

  setViewer(viewer: ViewerType) {
    this._viewer = viewer
  }

  setCurrentPage(page: number) {
    this.page = page
  }
}
