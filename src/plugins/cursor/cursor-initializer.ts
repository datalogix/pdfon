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

    this.dispatch('switchcursortool', { tool: options.cursor })
  }

  finish() {
    this.dispatch('storeonevent', { eventName: 'switchcursortool', key: 'cursor', parameter: 'tool' })
  }
}
