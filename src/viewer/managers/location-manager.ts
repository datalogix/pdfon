import { VisibleElement, VisibleElements } from '@/utils'
import { Manager } from './'

export type Location = {
  pageNumber: number
  scale?: string | number
  top: number
  left: number
  rotation: number
  openParams: string
}

export class LocationManager extends Manager {
  private _location?: Location

  get location() {
    return this._location
  }

  get baseUrl() {
    return location.href.split('#', 1)[0]
  }

  reset() {
    this._location = undefined
  }

  update(visible: VisibleElements) {
    if (!visible.first) return

    this.updateLocation(visible.first)
  }

  private updateLocation(firstPage: VisibleElement) {
    const currentScale = this.currentScale
    const currentScaleValue = this.currentScaleValue
    const normalizedScaleValue = parseFloat(String(currentScaleValue)) === currentScale
      ? Math.round(currentScale * 10000) / 100
      : currentScaleValue
    const pageNumber = firstPage.id
    const currentPage = this.pages[pageNumber - 1]
    const topLeft = currentPage.getPagePoint(
      this.viewerContainer.scrollLeft - firstPage.x,
      this.viewerContainer.scrollTop - firstPage.y,
    )
    const intTop = Math.round(topLeft[1])
    const intLeft = Math.round(topLeft[0])
    let openParams = `#page=${pageNumber}`

    if (!this.isInPresentationMode) {
      openParams += `&scale=${normalizedScaleValue},${intLeft},${intTop}`
    }

    this._location = {
      pageNumber,
      scale: normalizedScaleValue,
      top: intTop,
      left: intLeft,
      rotation: this.rotation,
      openParams,
    }

    this.dispatch('updateviewarea', { location: this._location })
  }

  getAnchorUrl(anchor = this._location?.openParams) {
    return `${this.baseUrl}${anchor ?? ''}`
  }
}
