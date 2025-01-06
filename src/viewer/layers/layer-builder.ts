import { Dispatcher } from '@/bus'
import type { PageViewport, OptionalContentConfig, RenderTask } from '@/pdfjs'
import { createElement, updateLayerDimensions } from '@/utils'
import type { Page, PageUpdate } from '../page'

export type LayerBuilderType = (LayerBuilder | (new () => LayerBuilder))

export abstract class LayerBuilder<T = any> extends Dispatcher {
  div?: HTMLDivElement

  protected _page?: Page
  protected abortController?: AbortController
  protected cancelled = false

  constructor(readonly params?: T) {
    super()
  }

  get priority() {
    return 0
  }

  get name() {
    return this.constructor.name.toLowerCase()
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

  findLayer<T>(layer: LayerBuilderType) {
    return this.layersPage.find<T>(layer)
  }

  hasLayer(layer: LayerBuilderType) {
    return !!this.findLayer(layer)
  }

  canRegister() {
    return true
  }

  canKeep(keep = true) {
    return keep && this.div !== undefined
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
    this.dispatch('init')
  }

  protected create(name: string, position: number) {
    const div = this.div = createElement('div', name)
    this.layersPage.add(div, position)
    this.updateLayerDimensions()
    return div
  }

  process(params: PageUpdate) {
    this.dispatch('process', params)
  }

  update(params: PageUpdate) {
    this.dispatch('update', params)
  }

  updateOptionalContentConfig(optionalContentConfig: OptionalContentConfig) {
    this.dispatch('updateoptionalcontentconfig', { optionalContentConfig })
  }

  cancel() {
    this.cancelled = true
    this.abortController?.abort()
    this.abortController = undefined

    this.dispatch('cancel')
  }

  hide() {
    if (!this.div) return

    this.div.hidden = true
    this.dispatch('hide')
  }

  show() {
    if (!this.div) return

    this.div.hidden = false
    this.dispatch('show')
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

    this.dispatch('render')
  }

  protected build(): Promise<void> | void {

  }

  finish(_renderTask: RenderTask) {
    this.dispatch('finish')
  }

  protected updateLayerDimensions(viewport?: PageViewport) {
    if (!this.div) return

    updateLayerDimensions(this.div, viewport ?? this.viewport)
  }
}
