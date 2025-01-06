import { Dispatcher, EventBus } from '@/bus'
import { type IL10n, L10n } from '@/l10n'
import { expose, resolvePageColors } from '@/utils'
import * as managers from './managers'
import { Logger } from './logger'
import type { PageColors, PageUpdate, ViewerOptions } from './'

export class Viewer extends Dispatcher {
  readonly eventBus: EventBus
  readonly l10n: IL10n
  readonly pageColors?: PageColors
  readonly annotationManager: managers.AnnotationManager
  readonly containerManager: managers.ContainerManager
  readonly documentManager: managers.DocumentManager
  readonly documentPropertiesManager: managers.DocumentPropertiesManager
  readonly initializerManager: managers.InitializerManager
  readonly layerBuildersManager: managers.LayerBuildersManager
  readonly layerPropertiesManager: managers.LayerPropertiesManager
  readonly locationManager: managers.LocationManager
  readonly optionalContentManager: managers.OptionalContentManager
  readonly pageLabelsManager: managers.PageLabelsManager
  readonly pagesManager: managers.PagesManager
  readonly presentationManager: managers.PresentationManager
  readonly renderManager: managers.RenderManager
  readonly rotationManager: managers.RotationManager
  readonly scaleManager: managers.ScaleManager
  readonly scrollManager: managers.ScrollManager
  readonly spreadManager: managers.SpreadManager
  protected managers: Set<managers.Manager>
  readonly logger = new Logger()

  constructor(readonly options: ViewerOptions = {}) {
    super()
    this.eventBus = options.eventBus ?? new EventBus()
    this.l10n = options.l10n ?? new L10n()
    this.pageColors = options.pageColors ?? resolvePageColors()
    this.managers = new Set([
      this.annotationManager = new managers.AnnotationManager(this),
      this.containerManager = new managers.ContainerManager(this),
      this.documentManager = new managers.DocumentManager(this),
      this.documentPropertiesManager = new managers.DocumentPropertiesManager(this),
      this.initializerManager = new managers.InitializerManager(this),
      this.layerBuildersManager = new managers.LayerBuildersManager(this),
      this.layerPropertiesManager = new managers.LayerPropertiesManager(this),
      this.locationManager = new managers.LocationManager(this),
      this.optionalContentManager = new managers.OptionalContentManager(this),
      this.pageLabelsManager = new managers.PageLabelsManager(this),
      this.pagesManager = new managers.PagesManager(this),
      this.presentationManager = new managers.PresentationManager(this),
      this.renderManager = new managers.RenderManager(this),
      this.rotationManager = new managers.RotationManager(this),
      this.scaleManager = new managers.ScaleManager(this),
      this.scrollManager = new managers.ScrollManager(this),
      this.spreadManager = new managers.SpreadManager(this),
    ])

    this.managers.forEach((manager) => {
      if (manager.canExpose) {
        this.expose(manager)
      }

      manager.init()
      manager.reset()
    })
  }

  render() {
    this.dispatch('rendered')

    return this.containerManager.container
  }

  reset() {
    this.managers.forEach(manager => manager.reset())
  }

  update() {
    const visible = this.scrollManager.getVisiblePages()

    if (visible.views.length === 0) {
      return
    }

    this.managers.forEach(manager => manager.update(visible))
  }

  refresh(noUpdate = false, params: PageUpdate = {}) {
    this.managers.forEach(manager => manager.refresh(params))

    if (noUpdate) {
      return
    }

    this.update()
  }

  private expose(manager: managers.Manager) {
    expose(this, manager, ['constructor', 'canExpose', 'init', 'reset', 'refresh', 'update', 'signal'])
  }
}
