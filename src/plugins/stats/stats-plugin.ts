import { formatTime } from '@/utils'
import { Plugin } from '../plugin'
import type { StoragePlugin } from '../storage'

export type StatsPluginParams = {
  interval?: number
  pageVisibilityPercentage?: number
}

export class StatsPlugin extends Plugin<StatsPluginParams> {
  private i?: NodeJS.Timeout
  private pagesViews: Map<number, number> = new Map()
  private time: number = 0

  get storage() {
    return this.viewer.getLayerProperty<StoragePlugin>('StoragePlugin')?.storage
  }

  protected init() {
    this.on(['documentdestroy', 'pagesinit'], () => this.destroy())

    this.on('storageinitialized', () => {
      this.dispatch('statsload', {
        pagesViews: new Map(JSON.parse(this.storage?.get('page-views', '[]'))),
        time: parseInt(this.storage?.get('usage-time', 0), 0),
      })
    })

    this.on('pagesloaded', () => {
      const interval = this.params?.interval ?? 3
      this.i = setInterval(() => this.tick(interval), interval * 1000)
      this.tick(0)
    })

    this.on('statsload', (params) => {
      if (params?.pagesViews !== undefined) this.pagesViews = params.pagesViews
      if (params?.time !== undefined) this.time = params.time
    })

    this.on('statsupdate', ({ time, pagesViews }) => {
      this.storage?.set('page-views', JSON.stringify(Array.from(pagesViews.entries())))
      this.storage?.set('usage-time', time)

      this.dispatch('informationadd', {
        key: 'page-views',
        information: {
          name: this.l10n.get('information.page-views'),
          value: pagesViews.size,
          total: this.viewer.pagesCount,
          order: 3,
        },
      })

      this.dispatch('informationadd', {
        key: 'usage-time',
        information: {
          name: this.l10n.get('information.usage-time'),
          value: formatTime(time),
          order: 4,
        },
      })
    })
  }

  protected tick(interval: number) {
    this.time += interval

    this.viewer.getVisiblePages().views
      .filter(view => view.percent > (this.params?.pageVisibilityPercentage ?? 30))
      .forEach(view => this.pagesViews.set(view.id, (this.pagesViews.get(view.id) ?? 0) + interval))

    this.dispatch('statsupdate', {
      time: this.time,
      pagesViews: this.pagesViews,
    })
  }

  protected destroy() {
    clearInterval(this.i)
    this.i = undefined
    this.pagesViews.clear()
    this.time = 0
  }
}
