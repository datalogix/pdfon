import { formatTime } from '@/utils'
import { Plugin } from '../plugin'
import type { StoragePlugin } from '../storage'
import type { InformationPlugin } from '../information'
import { StatsTracker } from './stats-tracker'

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
      onUpdate: (pagesViews, time) => this.dispatch('StatsUpdate', { pagesViews, time }),
      interval: this.resolvedParams?.interval,
      visibilityPercentage: this.resolvedParams?.visibilityPercentage,
    })

    this.on('DocumentDestroy', () => this._statsTracker?.stop())
    this.on('PagesLoaded', () => this._statsTracker?.start())

    this.on('StorageInit', () => {
      const pageViews = this.storage?.get('page-views', new Map())

      this.dispatch('StatsLoad', {
        pagesViews: typeof pageViews === 'string' ? new Map(JSON.parse(pageViews)) : pageViews,
        time: parseInt(this.storage?.get('usage-time', 0), 0),
      })
    })

    this.on('StatsLoad', (params) => {
      this._statsTracker?.load(
        params?.pagesViews !== undefined ? params.pagesViews : new Map(),
        params?.time !== undefined ? params.time : 0,
      )
    })

    this.on('StatsUpdate', ({ pagesViews, time }) => {
      this.storage?.set('page-views', pagesViews)
      this.storage?.set('usage-time', time)

      this.informationManager?.add({
        name: this.translate('page-views'),
        value: pagesViews.size,
        total: this.viewer.pagesCount,
        order: 3,
      })

      this.informationManager?.add({
        name: this.translate('usage-time'),
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
