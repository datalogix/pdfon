import { formatTime } from '@/utils'
import { Plugin } from '../plugin'
import type { StoragePlugin } from '../storage'
import { StatsTracker } from './stats-tracker'
import type { InformationPlugin } from '../information'

export type StatsPluginParams = {
  interval?: number
  visibilityPercentage?: number
}

export class StatsPlugin extends Plugin<StatsPluginParams> {
  private _statsTracker?: StatsTracker

  get statsTracker() {
    return this._statsTracker
  }

  get storage() {
    return this.viewer.getLayerProperty<StoragePlugin>('StoragePlugin')?.storage
  }

  get informationManager() {
    return this.viewer.getLayerProperty<InformationPlugin>('InformationPlugin')?.informationManager
  }

  protected init() {
    this._statsTracker = new StatsTracker({
      views: () => this.viewer.getVisiblePages().views,
      onUpdate: (pagesViews, time) => this.dispatch('statsupdate', { pagesViews, time }),
      ...this.params,
    })

    this.on('documentdestroy', () => this._statsTracker?.stop())
    this.on('pagesloaded', () => this._statsTracker?.start())

    this.on('storageinitialized', () => {
      this.dispatch('statsload', {
        pagesViews: new Map(JSON.parse(this.storage?.get('page-views', '[]'))),
        time: parseInt(this.storage?.get('usage-time', 0), 0),
      })
    })

    this.on('statsload', (params) => {
      this._statsTracker?.load(
        params?.pagesViews !== undefined ? params.pagesViews : new Map(),
        params?.time !== undefined ? params.time : 0,
      )
    })

    this.on('statsupdate', ({ pagesViews, time }) => {
      this.storage?.set('page-views', JSON.stringify(Array.from(pagesViews.entries())))
      this.storage?.set('usage-time', time)

      this.informationManager?.add({
        name: this.l10n.get('information.page-views'),
        value: pagesViews.size,
        total: this.viewer.pagesCount,
        order: 3,
      })

      this.informationManager?.add({
        name: this.l10n.get('information.usage-time'),
        value: formatTime(time),
        order: 4,
      })
    })
  }

  protected destroy() {
    this._statsTracker?.stop()
    this._statsTracker = undefined
  }
}
