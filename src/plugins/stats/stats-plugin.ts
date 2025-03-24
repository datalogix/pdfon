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
      onUpdated: (pagesViews, time) => this.dispatch('StatsUpdated', { pagesViews, time }),
      interval: this.resolvedParams?.interval,
      visibilityPercentage: this.resolvedParams?.visibilityPercentage,
    })

    this.on('DocumentInitialized', () => this._statsTracker?.start())
    this.on('DocumentDestroy', () => this._statsTracker?.stop())

    this.on('StorageLoaded', () => {
      let pagesViews = this.storage?.get('pages-views', this.storage?.get('page-views', new Map()))

      if (typeof pagesViews === 'string') {
        pagesViews = new Map(JSON.parse(pagesViews))
      } else if (Array.isArray(pagesViews)) {
        pagesViews = new Map(pagesViews.map(i => [i[0], i[1]]))
      }

      this.dispatch('StatsLoad', {
        pagesViews,
        time: parseInt(this.storage?.get('usage-time', 0), 0),
      })
    })

    this.on('StatsLoad', (params) => {
      this._statsTracker?.load(
        params?.pagesViews !== undefined ? params.pagesViews : new Map(),
        params?.time !== undefined ? params.time : 0,
      )
    })

    this.on('StatsUpdated', ({ pagesViews, time }) => {
      this.storage?.set('pages-views', Array.from(pagesViews))
      this.storage?.set('usage-time', time)

      this.informationManager?.add({
        name: this.translate('pages-views'),
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
