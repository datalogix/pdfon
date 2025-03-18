import { Plugin } from '../plugin'
import type { Interaction } from '../interaction'
import { InteractionEditorInitializer } from './interaction-editor-initializer'
import { InteractionEditorLayerBuilder } from './interaction-editor-layer-builder'
import { InteractionEditorManager } from './interaction-editor-manager'

export type InteractionEditorPluginParams = {
  interactions?: Interaction[]
}

export class InteractionEditorPlugin extends Plugin<InteractionEditorPluginParams> {
  protected initializers = [InteractionEditorInitializer]
  protected layerBuilders = [InteractionEditorLayerBuilder]
  private _interactionEditorManager?: InteractionEditorManager

  get interactionEditorManager() {
    return this._interactionEditorManager
  }

  protected init() {
    this._interactionEditorManager = new InteractionEditorManager()

    this.on('InteractionLoad', ({ interactions }) => this._interactionEditorManager?.set(interactions ?? []))
    this.on('DocumentDestroy', () => this._interactionEditorManager?.destroy())
  }

  protected onLoad() {
    if (this.resolvedParams?.interactions) {
      this._interactionEditorManager?.set(this.resolvedParams.interactions)
    }
  }

  protected destroy() {
    this._interactionEditorManager?.destroy()
    this._interactionEditorManager = undefined
  }
}
