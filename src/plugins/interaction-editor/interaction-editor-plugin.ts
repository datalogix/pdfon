import type { InitializerOptions } from '@/viewer'
import { createFetch, type FetchOptions } from '@/utils'
import { Plugin } from '../plugin'
import type { Interaction } from '../interaction'
import { InteractionEditorInitializer } from './interaction-editor-initializer'
import { InteractionEditorLayerBuilder } from './interaction-editor-layer-builder'
import { InteractionEditorManager } from './interaction-editor-manager'
import { InteractionTypeField } from './interaction-type'

export type InteractionEditorPluginParams = {
  api: FetchOptions | ((options: InitializerOptions) => FetchOptions)
  autoFetch?: boolean
  interactions?: Interaction[]
}

export class InteractionEditorPlugin extends Plugin<InteractionEditorPluginParams> {
  protected initializers = [InteractionEditorInitializer]
  protected layerBuilders = [InteractionEditorLayerBuilder]
  private _interactionEditorManager?: InteractionEditorManager
  static interactionTypes = new Map([
    ['image', new InteractionTypeField({ accept: '.gif,.png,.jpg,.jpeg' })],
    ['audio', new InteractionTypeField({ accept: '.mp3' })],
    ['video', new InteractionTypeField({ accept: '.mp4,.webm' })],
    ['link', new InteractionTypeField({ type: 'url' })],
    ['iframe', new InteractionTypeField({ type: 'url' })],
    ['text', new InteractionTypeField({ field: 'textarea', rows: 4 })],
  ])

  get interactionEditorManager() {
    return this._interactionEditorManager
  }

  protected async init() {
    this.on('DocumentInit', async ({ options }) => {
      const defaults = typeof this.resolvedParams?.api === 'function'
        ? this.resolvedParams?.api(options)
        : this.resolvedParams?.api

      this._interactionEditorManager = new InteractionEditorManager(
        this.eventBus,
        createFetch(defaults),
        this.resolvedParams?.autoFetch,
      )
    })

    this.on('DocumentDestroy', () => this.destroyInteractionEditorManager())
    this.on('InteractionEditorLoad', ({ interactions }) => this._interactionEditorManager?.set(interactions ?? []))
  }

  protected onLoad() {
    if (this.resolvedParams?.interactions) {
      this._interactionEditorManager?.set(this.resolvedParams?.interactions)
    }
  }

  protected destroyInteractionEditorManager() {
    this._interactionEditorManager?.destroy()
    this._interactionEditorManager = undefined
  }

  protected destroy() {
    this.destroyInteractionEditorManager()
  }
}
