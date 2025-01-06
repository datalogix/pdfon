import { Initializer, type InitializerParams } from './initializer'

export class AnimationInitializer extends Initializer {
  async apply({ options }: InitializerParams) {
    await new Promise(resolve => window.requestAnimationFrame(resolve))

    return options
  }
}
