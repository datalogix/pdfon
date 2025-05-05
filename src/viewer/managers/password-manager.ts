import { PasswordResponses } from '@/pdfjs'
import type { InitializerOptions } from '../initializers'
import { Manager } from './'

export class PasswordManager extends Manager {
  init() {
    this.on('DocumentLoad', ({ loadingTask, options }) => {
      loadingTask.onPassword = this.onPassword(options)
    })
  }

  private onPassword(options: InitializerOptions) {
    return (callback: (param: string | Error) => void, reason: number) => {
      const password = options.password ?? window.prompt(
        this.translate(reason === PasswordResponses.INCORRECT_PASSWORD ? 'password.error' : 'password.label'),
      )

      callback(password ? password : new Error('Password required'))
    }
  }
}
