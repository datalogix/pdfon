import { Initializer, type InitializerOptions } from '@/viewer'
import { CursorTool, type CursorPlugin } from './cursor-plugin'

export class CursorInitializer extends Initializer {
  get cursorPlugin() {
    return this.viewer.getLayerProperty<CursorPlugin>('CursorPlugin')
  }

  async prepare(options: InitializerOptions) {
    if (options.cursor === undefined) {
      options.cursor = this.cursorPlugin?.params?.cursorToolOnLoad ?? CursorTool.SELECT
    }

    return options
  }

  execute(options: InitializerOptions) {
    if (options.cursor === undefined) {
      return
    }

    this.cursorPlugin?.switchTool(options.cursor)
  }

  finish() {
    this.dispatch('storeonevent', { eventName: 'switchcursortool', key: 'cursor', parameter: 'tool' })
  }
}
