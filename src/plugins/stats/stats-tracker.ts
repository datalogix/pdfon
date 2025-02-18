import { VisibleElement } from '@/utils'

export type StatsTrackerOptions = {
  views: (() => VisibleElement[])
  interval?: number
  visibilityPercentage?: number
  onUpdated?: (pagesViews: Map<number, number>, time: number) => void
}

export class StatsTracker {
  private _pagesViews = new Map<number, number>()
  private _time: number = 0
  private i?: NodeJS.Timeout

  constructor(readonly options: StatsTrackerOptions) { }

  get pagesViews() {
    return this._pagesViews
  }

  get time() {
    return this._time
  }

  load(pagesViews = new Map(), time: number = 0) {
    this._pagesViews = pagesViews
    this._time = time
  }

  start() {
    const interval = this.options.interval ?? 3
    this.i = setInterval(() => this.tick(interval), interval * 1000)
    this.tick(0)
  }

  protected tick(interval: number) {
    const visibilityPercentage = this.options.visibilityPercentage ?? 30

    this._time += interval

    this.options.views()
      .filter(view => view.percent > visibilityPercentage)
      .forEach(view => this._pagesViews.set(view.id, (this._pagesViews.get(view.id) ?? 0) + interval))

    this.options.onUpdated?.(this._pagesViews, this._time)
  }

  stop() {
    clearInterval(this.i)
    this.i = undefined
    this._pagesViews.clear()
    this._time = 0
  }
}
