import { Dispatcher } from '@/bus'
import type { Initializer, ViewerType } from '@/viewer'
import type { Toolbar, ToolbarItemType } from '@/toolbar'

export {
  ToolbarItemType,
}

export type PluginType = (Plugin | (new (params?: any) => Plugin))

export abstract class Plugin<T = any> extends Dispatcher {
  private _toolbar?: Toolbar
  private _viewer?: ViewerType
  protected abortController?: AbortController
  protected initializer?: Initializer

  constructor(readonly params?: T) {
    super()
  }

  get name() {
    return this.constructor.name.toLowerCase().replace('plugin', '')
  }

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
    return this.abortController?.signal
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

  get container() {
    return this.viewer.container
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

  setCurrentPage(page: number) {
    this.page = page
  }

  get initialized() {
    return this.viewer.initialized
  }

  setToolbar(toolbar: Toolbar) {
    this._toolbar = toolbar
  }

  setViewer(viewer: ViewerType) {
    this._viewer = viewer
  }

  protected getToolbarItems(): Map<string, ToolbarItemType> {
    return new Map()
  }

  protected init(): Promise<void> | void {

  }

  async initialize() {
    for (const [name, item] of this.getToolbarItems()) {
      this.toolbar.register(name, item)
    }

    this.abortController = new AbortController()
    this.viewer.addLayerProperty(this.name, this)

    await this.init()

    if (this.initializer) {
      this.viewer.addInitializer(this.initializer)
    }

    this.dispatch(`plugin${this.name}init`)
  }

  protected destroy(): Promise<void> | void {

  }

  async terminate() {
    this.viewer.removeLayerProperty(this.name)
    this.abortController?.abort()
    this.abortController = undefined

    await this.destroy()

    if (this.initializer) {
      this.viewer.removeInitializer(this.initializer)
    }

    this.dispatch(`plugin${this.name}destroy`)
  }
}
