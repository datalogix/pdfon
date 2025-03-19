import { Initializer, type InitializerOptions } from '@/viewer'
import { resolveValue } from '@/utils'

export class InteractionEditorInitializer extends Initializer {
  async execute(options: InitializerOptions) {
    const interactions = await resolveValue(options.interactions, options)

    this.dispatch('InteractionEditorLoad', { interactions })
  }
}
