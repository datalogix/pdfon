import type { Plugin, PluginType } from '@/plugins/plugin'
import type { Toolbar } from '@/toolbar/toolbar'
import { generateName } from '@/utils'
import type { ViewerType } from '@/viewer'

export class PluginManager {
  constructor(protected _plugins: PluginType[] = []) {}

  get plugins() {
    return this._plugins
  }

  add(...plugin: PluginType[]) {
    this._plugins.push(...plugin)
  }

  remove(pluginToRemove: PluginType | string) {
    this._plugins = this._plugins.filter((plugin) => {
      if (typeof pluginToRemove === 'string') {
        return generateName(plugin, 'Plugin') !== pluginToRemove
      }

      if (typeof pluginToRemove === 'function') {
        return !(typeof plugin === 'function' && plugin === pluginToRemove) && !(plugin instanceof pluginToRemove)
      }

      return plugin !== pluginToRemove
    })
  }

  private resolve(params?: Record<string, any>) {
    const plugins = new Map<string, Plugin>()

    for (const plugin of this._plugins) {
      const name = typeof plugin === 'function'
        ? plugin.name?.toLowerCase().replace('plugin', '')
        : plugin.name

      const instance = typeof plugin === 'function'
        ? new plugin(params?.[name])
        : plugin

      plugins.set(name, instance)
    }

    return Array.from(plugins.values())
  }

  async initialize(toolbar: Toolbar, viewer: ViewerType, params?: Record<string, any>) {
    const plugins = this.resolve(params)

    await Promise.allSettled(plugins.map((plugin) => {
      plugin.setToolbar(toolbar)
      plugin.setViewer(viewer)

      return plugin.initialize()
    }))

    return plugins
  }
}
