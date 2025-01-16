import { Initializer, type InitializerOptions } from './initializer'

export class AnimationInitializer extends Initializer {
  async prepare(options: InitializerOptions) {
    await new Promise(resolve => window.requestAnimationFrame(resolve))

    return options
  }
}
