import { SpreadMode, ScrollMode } from '@/enums'
import { createElement } from '@/utils'
import { Manager } from './'

export function isValidSpreadMode(mode: number) {
  return (
    Number.isInteger(mode)
    && Object.values(SpreadMode).includes(mode)
    && mode !== SpreadMode.UNKNOWN
  )
}

export class SpreadManager extends Manager {
  private _spreadMode = SpreadMode.NONE

  reset() {
    this._spreadMode = SpreadMode.NONE
  }

  get spreadMode() {
    return this._spreadMode
  }

  set spreadMode(mode) {
    if (this.spreadMode === mode || mode === SpreadMode.UNKNOWN) {
      return
    }

    if (!isValidSpreadMode(mode)) {
      throw new Error(`Invalid spread mode: ${mode}`)
    }

    this._spreadMode = mode
    this.dispatch('spreadmodechanged', { mode })
    this.updateSpreadMode(this.currentPageNumber)
  }

  updateSpreadMode(pageNumber?: number) {
    if (!this.pdfDocument) {
      return
    }

    if (this.scrollMode === ScrollMode.PAGE) {
      this.scrollManager.ensurePageVisible()
    } else {
      this.viewerContainer.textContent = ''

      if (this.spreadMode === SpreadMode.NONE) {
        for (const page of this.pages) {
          this.viewerContainer.append(page.div)
        }

        return
      }

      const parity = this.spreadMode - 1
      let spread: Element | null = null

      for (let i = 0, ii = this.pages.length; i < ii; ++i) {
        if (spread === null) {
          spread = createElement('div', 'spread')
          this.viewerContainer.append(spread)
        } else if (i % 2 === parity) {
          spread = spread.cloneNode(false) as Element
          this.viewerContainer.append(spread)
        }

        spread!.append(this.pages[i].div)
      }
    }

    if (!pageNumber) {
      return
    }

    if (this.currentScaleValue && isNaN(parseFloat(this.currentScaleValue))) {
      this.scaleManager.setScale(this.currentScaleValue, { noScroll: true })
    }

    this.pagesManager.setCurrentPageNumber(pageNumber, true)
    this.viewer.update()
  }
}
