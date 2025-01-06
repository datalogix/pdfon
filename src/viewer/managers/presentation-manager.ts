import { PresentationModeState } from '@/enums'
import { Manager } from './'

export class PresentationManager extends Manager {
  private _presentationModeState = PresentationModeState.UNKNOWN

  init() {
    this._presentationModeState = PresentationModeState.UNKNOWN
    this.on('presentationmodechanged', ({ state }) => this._presentationModeState = state)
  }

  get presentationModeState() {
    return this._presentationModeState
  }

  get isInPresentationMode() {
    return this.presentationModeState === PresentationModeState.FULLSCREEN
  }

  get isChangingPresentationMode() {
    return this.presentationModeState === PresentationModeState.CHANGING
  }
}
