import { Extension } from '@/core/extension'
import type { ScrollMode, SpreadMode } from '@/enums'

export type InitializerOptions = Partial<{
  [key: string]: any
  id?: number | string
  scroll?: ScrollMode
  spread?: SpreadMode
  rotation?: number
  page?: number
  scale?: number | string
  scrollTop?: number
  scrollLeft?: number
}>

export type InitializerExecuteResult = void | ((options: InitializerOptions) => void)

export type InitializerType = (Initializer | (new () => Initializer))

export abstract class Initializer extends Extension {
  get order() {
    return 0
  }

  prepare(options: InitializerOptions): Promise<InitializerOptions> | InitializerOptions {
    return options
  }

  execute(_options: InitializerOptions): Promise<void> | void {
    //
  }

  finish(_options: InitializerOptions): Promise<void> | void {
    //
  }
}
