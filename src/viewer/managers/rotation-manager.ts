import { Manager } from './manager'

export function isValidRotation(rotation: number) {
  return Number.isInteger(rotation) && rotation % 90 === 0
}

export class RotationManager extends Manager {
  private _rotation = 0

  init() {
    this.on('rotationchanging', ({ pageNumber }) => {
      this.renderManager.forceRendering()

      // Ensure that the active page doesn't change during rotation.
      this.pagesManager.currentPageNumber = pageNumber
    })
  }

  reset() {
    this._rotation = 0
  }

  get rotation() {
    return this._rotation
  }

  set rotation(rotation) {
    if (!isValidRotation(rotation)) {
      throw new Error('Invalid pages rotation.')
    }

    if (!this.pdfDocument) {
      return
    }

    rotation %= 360

    if (rotation < 0) {
      rotation += 360
    }

    if (this._rotation === rotation) {
      return
    }

    this._rotation = rotation
    const pageNumber = this.currentPageNumber

    this.viewer.refresh(true, { rotation })

    if (this.currentScaleValue) {
      this.scaleManager.setScale(this.currentScaleValue, { noScroll: true })
    }

    this.dispatch('rotationchanging', {
      rotation,
      pageNumber,
    })

    this.viewer.update()
  }
}
