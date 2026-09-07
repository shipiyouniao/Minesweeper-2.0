import { test } from 'node:test'
import assert from 'node:assert/strict'
import { languageOf, resolveLanguage } from '../src/i18n.js'

test('Chinese and Japanese browser locales are localized; all other locales use English', () => {
  for (const locale of ['zh', 'zh-CN', 'zh-TW', 'zh-Hant-HK', 'ZH_cn']) {
    assert.equal(languageOf(locale), 'zh')
  }

  for (const locale of ['ja', 'ja-JP', 'jp']) {
    assert.equal(languageOf(locale), 'ja')
  }

  for (const locale of ['en-US', 'fr-FR', 'de', 'ko-KR', '', null]) {
    assert.equal(languageOf(locale), 'en')
  }
})

test('a valid link overrides saved language, and invalid links fall through to saved/browser choices', () => {
  assert.equal(resolveLanguage('en', 'ja', 'zh-CN'), 'en')
  assert.equal(resolveLanguage(null, 'ja', 'zh-CN'), 'ja')
  assert.equal(resolveLanguage('invalid', 'zh', 'ja-JP'), 'zh')
  assert.equal(resolveLanguage('', null, 'ja-JP'), 'ja')
  assert.equal(resolveLanguage(null, null, 'fr-FR'), 'en')
})
import { message, translations } from '../src/i18n.js'
import { enMessages } from '../src/locales/en.js'
import { zhMessages } from '../src/locales/zh.js'
import { jaMessages } from '../src/locales/ja.js'
import type { MessageKey, MessageParameters } from '../src/types/message-catalog.js'

/** Every localized entry has the same fields and can be formatted without missing parameters. */
test('all catalog keys and named parameters are complete in every locale', () => {
  const keys = Object.keys(enMessages) as MessageKey[]
  for (const catalog of [zhMessages, jaMessages])
    assert.deepEqual(Object.keys(catalog).sort(), [...keys].sort())
  for (const key of keys) {
    const params: { [name: string]: string | number } = {}
    for (const match of enMessages[key].matchAll(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g))
      params[match[1]!] = 7
    for (const language of ['en', 'zh', 'ja'] as const) {
      assert.ok(message(language, key, params).trim(), `${language}:${key}`)
      assert.doesNotMatch(message(language, key, params), /\{[a-zA-Z][a-zA-Z0-9_]*\}/)
    }
  }
  assert.deepEqual(Object.keys(translations.en).sort(), Object.keys(translations.zh).sort())
  assert.deepEqual(Object.keys(translations.en).sort(), Object.keys(translations.ja).sort())
})

test('named interpolation preserves zero and literal replacement text without cross-locale state', () => {
  assert.equal(message('zh', 'camp-copy.count-floors', { count: 0 }), '0 层')
  assert.equal(message('en', 'camp-copy.count-floors', { count: 12 }), '12 floors')
  assert.equal(message('ja', 'camp-copy.count-floors', { count: 12 }), '12階')
  const literal: MessageParameters = { count: '$& {count} <tag>' }
  assert.equal(message('en', 'camp-copy.count-floors', literal), '$& {count} <tag> floors')
  assert.throws(() => message('en', 'camp-copy.count-floors'), /Missing translation parameter/)
})
