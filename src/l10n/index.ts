import i18next, { type TOptionsBase } from 'i18next'
import { $Dictionary } from 'i18next/typescript/helpers'
import LanguageDetector from 'i18next-browser-languagedetector'
import ptBR from './locales/pt-BR.json'

export interface IL10n {
  get(key: string | string[], options?: object): string
  getLanguage(): string
  getDirection(): 'ltr' | 'rtl'
}

export class L10n implements IL10n {
  constructor() {
    i18next
      .use(LanguageDetector)
      .init({
        // debug: true,
        fallbackLng: 'pt-BR',
        resources: {
          'pt-BR': {
            translation: ptBR,
          },
        },
      })
  }

  get(key: string | string[], options?: (TOptionsBase & $Dictionary)): string {
    return i18next.t(key, options)
  }

  getLanguage() {
    return i18next.language
  }

  getDirection() {
    return i18next.dir()
  }
}
