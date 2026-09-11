import { nativeNames } from './locales/native-names.js'
import { enMessages } from './locales/en.js'
import { jaMessages } from './locales/ja.js'
import { zhMessages } from './locales/zh.js'
import type { Language, Translations } from './types/localization.js'
import type { MessageKey, MessageParameters } from './types/message-catalog.js'

import { zh } from './locales/zh-base.js'

import { en } from './locales/en-base.js'

import { ja } from './locales/ja-base.js'

export const translations: Translations = { zh, en, ja }

/** Recognize supported locale tags and the original Japanese URL alias. */
export function parseLanguage(value: string | null): Language | null {
  if (value === null) {
    return null
  }

  const locale = value.trim().toLowerCase().split(/[-_]/)[0]

  switch (locale) {
    case 'zh':
      return 'zh'
    case 'en':
      return 'en'
    case 'ja':
    case 'jp':
      return 'ja'
    default:
      return null
  }
}

/** Apply the default language only after boundary normalization. */
export function languageOf(value: string | null): Language {
  return parseLanguage(value) ?? 'en'
}

/** Prefer a supported link override, then an explicit saved choice, then the browser locale. */
export function resolveLanguage(
  link: string | null,
  saved: Language | null,
  browser: string | null,
): Language {
  return parseLanguage(link) ?? saved ?? languageOf(browser)
}

/** Resolve a typed key and interpolate named values without recursive substitution. */
export function message(
  language: Language,
  key: MessageKey,
  parameters: MessageParameters = {},
): string {
  const catalog = language === 'zh' ? zhMessages : language === 'ja' ? jaMessages : enMessages
  return catalog[key].replace(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g, (_match, name: string) => {
    const value = parameters[name]
    if (value === undefined) throw new Error('Missing translation parameter ' + key + ':' + name)

    return String(value)
  })
}

/** Name each locale in its own language for the language picker. */
export function languageName(language: Language): string {
  return nativeNames[language]
}
