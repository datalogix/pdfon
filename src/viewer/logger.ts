import * as pdfjs from '@/pdfjs'
import { capitalize } from '@/utils'
import { version } from '../../package.json'

export class Logger {
  log(type: 'info' | 'warn' | 'error' = 'info', message: string, info?: any, header?: boolean) {
    const messages = []

    if (header) {
      messages.push(`(PdfOn: ${version || '?'} - PDF.js: ${pdfjs.version || '?'} [${pdfjs.build || '?'}])`)
    }

    messages.push(message)

    if (info instanceof Error) {
      messages.push(`Name: ${info.name}`)
      messages.push(`Message: ${info.message}`)
      if (info.stack) messages.push(`Stack: ${info.stack}`)
    } else if (typeof info === 'string') {
      messages.push(info)
    } else if (info) {
      messages.push(...Object.entries(info).map(([prop, value]) => `${capitalize(prop)}: ${value}`))
    }

    console[type](messages.join('\n'))
  }

  warn(message: string, info?: any, header?: boolean) {
    this.log('warn', message, info, header)
  }

  info(message: string, info?: any, header?: boolean) {
    this.log('info', message, info, header)
  }

  error(message: string, info?: any, header?: boolean) {
    this.log('error', message, info, header)
  }
}
