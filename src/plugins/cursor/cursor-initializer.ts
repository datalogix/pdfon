import { Initializer, type InitializerOptions } from '@/viewer'
import { CursorTool } from './cursor-plugin'

export class CursorInitializer extends Initializer {
  constructor(private cursorToolOnLoad?: CursorTool) {
    super()
  }

  async prepare(options: InitializerOptions) {
    if (options.cursor === undefined) {
      options.cursor = this.cursorToolOnLoad ?? CursorTool.SELECT
    }

    return options
  }

  execute(options: InitializerOptions) {
    if (options.cursor === undefined) {
      return
    }

    this.dispatch('SwitchCursorTool', { tool: options.cursor })
  }

  finish() {
    this.dispatch('StoreOnEvent', { eventName: 'SwitchCursorTool', key: 'cursor', parameter: 'tool' })
  }
}
