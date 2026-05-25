import i18next, { type TOptions } from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import ptBR from './locales/pt-BR.json'

export interface IL10n {
  get(key: string | string[], options?: object): string
  getLanguage(): string
  getDirection(): 'ltr' | 'rtl'
}

export type Translator = {
  translate: (key: string, options?: object) => string
}

export type Translatable = {
  translator: Translator
}

export class L10n implements IL10n {
  constructor() {
    i18next
      .use(LanguageDetector)
      .init({
        debug: false,
        fallbackLng: 'pt-BR',
        resources: {
          'pt-BR': {
            translation: ptBR,
          },
        },
      })
  }

  get(key: string | string[], options?: object): string {
    return i18next.t(key, options as (Omit<TOptions, 'context'> & { context?: string | undefined }))
  }

  getLanguage() {
    return i18next.language
  }

  getDirection() {
    return i18next.dir()
  }
}
