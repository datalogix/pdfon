import { Initializer, type InitializerOptions } from '@/viewer'
import { resolveValue } from '@/utils'

export class ResourceInitializer extends Initializer {
  async execute(options: InitializerOptions) {
    const resources = await resolveValue(options.resources, options)

    this.dispatch('ResourceLoad', { resources })
  }
}
