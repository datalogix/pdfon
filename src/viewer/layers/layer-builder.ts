import { Dispatcher } from '@/bus'
import type { PageViewport, OptionalContentConfig, RenderTask } from '@/pdfjs'
import { createElement, generateName, updateLayerDimensions } from '@/utils'
import type { Page, PageUpdate } from '../page'

export type LayerBuilderType = (LayerBuilder | (new () => LayerBuilder))

export abstract class LayerBuilder<T = any> extends Dispatcher {
  div?: HTMLDivElement

  private _name?: string
  private _page?: Page
  protected abortController?: AbortController
  protected cancelled = false

  constructor(readonly params?: T) {
    super()
  }

  get priority() {
    return 0
  }

  get name() {
    return this._name ||= generateName(this)
  }

  get page() {
    return this._page!
  }

  get id() {
    return this.page.id
  }

  get options() {
    return this.page.options
  }

  get eventBus() {
    return this.page.eventBus
  }

  get signal() {
    return this.abortController?.signal
  }

  get l10n() {
    return this.options.l10n
  }

  get pdfPage() {
    return this.page.pdfPage
  }

  get viewport() {
    return this.page.viewport
  }

  get canvas() {
    return this.page.canvas
  }

  get canvasPage() {
    return this.page.canvasPage
  }

  get layerProperties() {
    return this.options.layerProperties
  }

  get pdfDocument() {
    return this.layerProperties.pdfDocument
  }

  get layersPage() {
    return this.page.layersPage
  }

  get logger() {
    return this.options.logger
  }

  findLayer<T>(layer: LayerBuilderType | string) {
    return this.layersPage.find<T>(layer)
  }

  hasLayer(layer: LayerBuilderType | string) {
    return !!this.findLayer(layer)
  }

  canRegister() {
    return true
  }

  canKeep(keep = true): boolean | HTMLDivElement | undefined {
    return keep && this.div
  }

  canCancel(keep?: boolean) {
    return !keep || !this.div
  }

  stopOnException(_ex: any) {
    return false
  }

  setPage(page: Page) {
    this._page = page
  }

  dispatch(name: string, data = {}) {
    return super.dispatch(`${this.name}${name}`, data)
  }

  init(): Promise<void> | void {
    this.dispatch('Init')
  }

  protected create(name: string, position: number) {
    const div = this.div = createElement('div', name)
    this.layersPage.add(div, position)
    this.updateLayerDimensions()
    return div
  }

  process(params: PageUpdate) {
    this.dispatch('Process', params)
  }

  update(params: PageUpdate) {
    this.dispatch('Update', params)
  }

  updateOptionalContentConfig(optionalContentConfig: OptionalContentConfig) {
    this.dispatch('UpdateOptionalContentConfig', { optionalContentConfig })
  }

  cancel() {
    this.cancelled = true
    this.abortController?.abort()
    this.abortController = undefined

    this.dispatch('Cancel')
  }

  hide(_keep?: boolean) {
    if (!this.div) return

    this.div.hidden = true
    this.dispatch('Hide')
  }

  show() {
    if (!this.div) return

    this.div.hidden = false
    this.dispatch('Show')
  }

  async render(_postponeDrawing?: boolean) {
    if (this.cancelled) {
      return
    }

    if (this.div) {
      this.updateLayerDimensions()
      this.show()
      return
    }

    await this.build()

    this.dispatch('Render')
  }

  protected build(): Promise<void> | void {

  }

  finish(_renderTask: RenderTask) {
    this.dispatch('Finish')
  }

  protected updateLayerDimensions(viewport?: PageViewport) {
    if (!this.div) return

    updateLayerDimensions(this.div, viewport ?? this.viewport)
  }
}
