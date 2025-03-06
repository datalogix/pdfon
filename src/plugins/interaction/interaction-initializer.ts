import { Initializer, type InitializerOptions } from '@/viewer'
import { resolveValue } from '@/utils'

export class InteractionInitializer extends Initializer {
  async execute(options: InitializerOptions) {
    const interactions = await resolveValue(options.interactions, options)

    this.dispatch('InteractionLoad', { interactions })
  }
}
