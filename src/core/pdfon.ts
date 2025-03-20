import { Dispatcher, EventBus } from '@/bus'
import type { PluginType } from '@/plugins'
import { Toolbar, type ToolbarOptions, type ToolbarItemType } from '@/toolbar'
import { createElement } from '@/utils'
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
  protected plugins: PluginType[] = []
  protected toolbarItems: Map<string, ToolbarItemType> = new Map()

  constructor(options?: Partial<{
    eventBus: EventBus
    plugins: PluginType[]
    toolbarItems: Map<string, ToolbarItemType>
  }>) {
    super()

    this.eventBus = options?.eventBus ?? new EventBus()
    this.plugins = options?.plugins ?? DEFAULT_PLUGINS
    this.toolbarItems = options?.toolbarItems ?? DEFAULT_TOOLBAR_ITEMS
  }

  addPlugin(...plugin: PluginType[]) {
    this.plugins.push(...plugin)
  }

  removePlugin(pluginToRemove: PluginType | string) {
    this.plugins = this.plugins.filter((plugin) => {
      if (typeof pluginToRemove === 'string') {
        const pluginClassName = typeof plugin === 'function' ? plugin.name : plugin.constructor.name
        return pluginClassName !== pluginToRemove
      }

      if (typeof pluginToRemove === 'function') {
        return !(typeof plugin === 'function' && plugin === pluginToRemove) && !(plugin instanceof pluginToRemove)
      }

      return plugin !== pluginToRemove
    })
  }

  protected resolvePlugins(params?: Record<string, any>) {
    return this.plugins.map(plugin => typeof plugin === 'function'
      ? new plugin(params?.[plugin.name.toLowerCase().replace('plugin', '')])
      : plugin,
    )
  }

  protected async initializePlugins(toolbar: Toolbar, viewer: ViewerType, params?: Record<string, any>) {
    const plugins = this.resolvePlugins(params)

    await Promise.allSettled(plugins.map((plugin) => {
      plugin.setToolbar(toolbar)
      plugin.setViewer(viewer)

      return plugin.initialize()
    }))

    this.dispatch('PluginsInit', { plugins })

    return plugins
  }

  registerToolbarItem(name: string, item: ToolbarItemType) {
    this.toolbarItems.set(name, item)
  }

  unregisterToolbarItem(name: string) {
    this.toolbarItems.delete(name)
  }

  protected async initializeToolbar(toolbar: Toolbar) {
    this.toolbarItems.forEach((item, name) => toolbar.register(name, item))

    await toolbar.initialize()
  }

  async render(options: Partial<PdfonOptions> = {}) {
    const opts = {
      ...DEFAULT_OPTIONS,
      ...options,
    }

    let container = opts.container instanceof HTMLDivElement
      ? opts.container
      : (opts.container ? document.getElementById(opts.container) : null)

    if (!container) {
      container = document.body.appendChild(createElement('div'))
    }

    container.classList.add('pdfon')
    container.tabIndex = 0

    const viewer = new Viewer({
      eventBus: this.eventBus,
      ...opts.viewerOptions,
    }) as ViewerType

    const toolbar = new Toolbar(viewer, opts.toolbarOptions)

    container.appendChild(toolbar.render())
    container.appendChild(viewer.render())

    const plugins = await this.initializePlugins(toolbar, viewer, opts.plugins)
    await this.initializeToolbar(toolbar)

    await Promise.allSettled(plugins.map(plugin => plugin.load()))
    this.dispatch('PluginsLoaded', { plugins })

    return viewer.start()
  }
}
