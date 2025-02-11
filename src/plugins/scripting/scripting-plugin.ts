import { Plugin } from '../plugin'
import { ScriptingManager } from './scripting-manager'

export class ScriptingPlugin extends Plugin {
  private _scriptingManager?: ScriptingManager

  get scriptingManager() {
    return this._scriptingManager
  }

  protected init() {
    this._scriptingManager = new ScriptingManager(this.viewer)

    this.on('OnePageRendered', ({ pdfDocument }) => this._scriptingManager?.setDocument(pdfDocument))
    this.on('DocumentClose', () => this._scriptingManager?.clearDocument())
  }

  protected destroy() {
    this._scriptingManager?.clearDocument()
    this._scriptingManager = undefined
  }
}
