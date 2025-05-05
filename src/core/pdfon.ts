import { Dispatcher, EventBus } from '@/bus'
import { PluginManager, type PluginType } from '@/plugins'
import { ToolbarManager, type ToolbarOptions, type ToolbarItemType } from '@/toolbar'
import { Modal } from '@/tools'
import { rootContainer } from '@/utils'
import { Viewer, type ViewerType, type ViewerOptions } from '@/viewer'
import { DEFAULT_PLUGINS, DEFAULT_TOOLBAR_ITEMS, DEFAULT_OPTIONS } from './defaults'

export type PdfonOptions = {
  container: string | HTMLDivElement
  toolbarOptions?: ToolbarOptions
  viewerOptions?: ViewerOptions
  plugins?: Record<string, any>
}

export class Pdfon extends Dispatcher {
  readonly eventBus: EventBus
  readonly pluginManager: PluginManager
  readonly toolbarManager: ToolbarManager

  constructor(options?: Partial<{
    eventBus: EventBus
    plugins: PluginType[]
    toolbarItems: Map<string, ToolbarItemType>
  }>) {
    super()

    this.eventBus = options?.eventBus ?? new EventBus()
    this.pluginManager = new PluginManager(options?.plugins ?? DEFAULT_PLUGINS)
    this.toolbarManager = new ToolbarManager(options?.toolbarItems ?? DEFAULT_TOOLBAR_ITEMS)
  }

  addPlugin(...plugin: PluginType[]) {
    this.pluginManager.add(...plugin)
  }

  removePlugin(pluginToRemove: PluginType | string) {
    this.pluginManager.remove(pluginToRemove)
  }

  addToolbarItem(name: string, item: ToolbarItemType) {
    this.toolbarManager.add(name, item)
  }

  removeToolbarItem(name: string) {
    this.toolbarManager.remove(name)
  }

  async render(options: Partial<PdfonOptions> = {}) {
    const opts = {
      ...DEFAULT_OPTIONS,
      ...options,
    }

    const viewer = new Viewer({
      eventBus: this.eventBus,
      ...opts.viewerOptions,
    }) as ViewerType

    const toolbar = this.toolbarManager.build(viewer, opts.toolbarOptions)

    const container = rootContainer(opts.container)
    container.appendChild(toolbar.render())
    container.appendChild(viewer.render())

    Modal.root = container

    const plugins = await this.pluginManager.initialize(toolbar, viewer, opts.plugins)
    await this.toolbarManager.initialize()
    await Promise.allSettled(plugins.map(plugin => plugin.load()))

    return viewer.start()
  }
}
