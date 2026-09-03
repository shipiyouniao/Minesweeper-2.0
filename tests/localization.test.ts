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
