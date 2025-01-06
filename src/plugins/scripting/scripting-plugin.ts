import { Plugin } from '../plugin'
import { ScriptingManager } from './scripting-manager'

export class ScriptingPlugin extends Plugin {
  private _scriptingManager?: ScriptingManager

  get scriptingManager() {
    return this._scriptingManager
  }

  protected init() {
    this._scriptingManager = new ScriptingManager(this.viewer)

    this.on('onepagerendered', ({ pdfDocument }) => this._scriptingManager?.setDocument(pdfDocument))
    this.on('documentclose', () => this._scriptingManager?.setDocument())
  }

  protected destroy() {
    this._scriptingManager?.setDocument()
    this._scriptingManager = undefined
  }
}
