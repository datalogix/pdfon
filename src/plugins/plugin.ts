import { Dispatcher } from '@/bus'
import type { Translatable } from '@/l10n'
import type { Toolbar, ToolbarItemType } from '@/toolbar'
import { createResolvedObject, resolveObject, type ResolvedParams } from '@/utils'
import type { Initializer, InitializerType, LayerBuilderType, ViewerType } from '@/viewer'

export { ToolbarItemType }

export type PluginType = (Plugin | (new (params?: any) => Plugin))

export abstract class Plugin<T = any> extends Dispatcher implements Translatable {
  private _name?: string
  private _toolbar?: Toolbar
  private _viewer?: ViewerType
  protected abortController?: AbortController
  protected initializers: InitializerType[] = []
  protected layerBuilders: LayerBuilderType[] = []
  private _initializers: Initializer[] = []
  private _layerBuilders: LayerBuilderType[] = []
  private _resolvedParams?: T
  readonly params

  constructor(params?: ResolvedParams<T>) {
    super()

    if (params) {
      this.params = createResolvedObject(params)
    }
  }

  get name() {
    if (!this._name) {
      this._name = this.constructor.name.toLowerCase().replace('plugin', '')
    }

    return this._name
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

  get initialized() {
    return this.viewer.initialized
  }

  get resolvedParams() {
    return this._resolvedParams
  }

  get translator() {
    return {
      translate: this.translate.bind(this),
    }
  }

  translate(key: string, options?: object) {
    return this.l10n.get(`plugins.${this.name}.${key}`.toLowerCase(), options)
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

  protected init(): Promise<void> | void {

  }

  protected onLoad(_resolvedParams?: T): Promise<void> | void {

  }

  protected destroy(): Promise<void> | void {

  }

  protected getToolbarItems(): Map<string, ToolbarItemType> | Promise<Map<string, ToolbarItemType>> {
    return new Map()
  }

  protected getInitializers(): InitializerType[] | Promise<InitializerType[]> {
    return []
  }

  protected getLayerBuilders(): LayerBuilderType[] | Promise<LayerBuilderType[]> {
    return []
  }

  async initialize() {
    if (this.params) {
      this._resolvedParams = await resolveObject(this.params) as T
    }

    for (const [name, item] of await this.getToolbarItems()) {
      this.toolbar.register(name, item)
    }

    this.abortController = new AbortController()
    this.viewer.addLayerProperty(this.name, this)

    await this.init()

    this._initializers = this.initializers.concat(await this.getInitializers())
      .map(initializer => typeof initializer === 'function' ? new initializer() : initializer)
    this._layerBuilders = this.layerBuilders.concat(await this.getLayerBuilders())

    this._initializers.forEach(initialize => this.viewer.addInitializer(initialize))
    this._layerBuilders.forEach(layerBuilder => this.viewer.addLayerBuilder(layerBuilder))

    this.dispatch(`Plugin${this.name}Init`)
  }

  async load() {
    this.onLoad(this._resolvedParams)
    this.dispatch(`Plugin${this.name}Loaded`)
  }

  async terminate() {
    this.viewer.removeLayerProperty(this.name)
    this.abortController?.abort()
    this.abortController = undefined

    await this.destroy()

    this._initializers.forEach(initialize => this.viewer.removeInitializer(initialize))
    this._layerBuilders.forEach(layerBuilder => this.viewer.removeLayerBuilder(layerBuilder))

    this.dispatch(`Plugin${this.name}Destroy`)
  }
}
