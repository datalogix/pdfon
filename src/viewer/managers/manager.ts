import { Dispatcher } from '@/bus'
import { VisibleElements } from '@/utils'
import type { PageUpdate, Viewer } from '../'

export abstract class Manager extends Dispatcher {
  constructor(protected readonly viewer: Viewer) {
    super()
  }

  init() {

  }

  reset() {

  }

  refresh(_params: PageUpdate) {

  }

  update(_visible: VisibleElements) {

  }

  get canExpose() {
    return true
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

  get annotationManager() {
    return this.viewer.annotationManager
  }

  get containerManager() {
    return this.viewer.containerManager
  }

  get documentManager() {
    return this.viewer.documentManager
  }

  get documentPropertiesManager() {
    return this.viewer.documentPropertiesManager
  }

  get initializerManager() {
    return this.viewer.initializerManager
  }

  get layerBuildersManager() {
    return this.viewer.layerBuildersManager
  }

  get locationManager() {
    return this.viewer.locationManager
  }

  get logger() {
    return this.viewer.logger
  }

  get optionalContentManager() {
    return this.viewer.optionalContentManager
  }

  get pageLabelsManager() {
    return this.viewer.pageLabelsManager
  }

  get pagesManager() {
    return this.viewer.pagesManager
  }

  get presentationManager() {
    return this.viewer.presentationManager
  }

  get renderManager() {
    return this.viewer.renderManager
  }

  get rotationManager() {
    return this.viewer.rotationManager
  }

  get scaleManager() {
    return this.viewer.scaleManager
  }

  get scrollManager() {
    return this.viewer.scrollManager
  }

  get spreadManager() {
    return this.viewer.spreadManager
  }

  get pdfDocument() {
    return this.documentManager.getDocument()
  }

  get rootContainer() {
    return this.containerManager.rootContainer
  }

  get container() {
    return this.containerManager.container
  }

  get viewerContainer() {
    return this.containerManager.viewerContainer
  }

  get pagesCount() {
    return this.pagesManager.pagesCount
  }

  get pages() {
    return this.pagesManager.pages
  }

  get currentPageNumber() {
    return this.pagesManager.currentPageNumber
  }

  get currentScale() {
    return this.scaleManager.currentScale
  }

  get currentScaleValue() {
    return this.scaleManager.currentScaleValue
  }

  get scrollMode() {
    return this.scrollManager.scrollMode
  }

  get spreadMode() {
    return this.spreadManager.spreadMode
  }

  get rotation() {
    return this.rotationManager.rotation
  }

  get renderingQueue() {
    return this.renderManager.renderingQueue
  }

  get isInPresentationMode() {
    return this.presentationManager.isInPresentationMode
  }

  get isChangingPresentationMode() {
    return this.presentationManager.isChangingPresentationMode
  }

  get location() {
    return this.locationManager.location
  }
}
