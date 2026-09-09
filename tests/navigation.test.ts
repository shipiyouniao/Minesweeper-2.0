import assert from 'node:assert/strict'
import test from 'node:test'
import { FREE_MODES, parseRoute, routeHref, sameRoute } from '../src/ui/navigation.js'

test('bare and unknown URLs open home while menus never masquerade as classic games', () => {
  for (const search of ['', '?lang=zh', '?ruleset=missing', '?page=unknown']) {
    assert.deepEqual(parseRoute(search), { page: 'home' })
  }
  assert.deepEqual(parseRoute('?page=free&lang=ja'), { page: 'free' })
})

test('all explicit game links and old classic difficulty links keep their destination', () => {
  for (const mode of [...FREE_MODES, 'expedition']) {
    assert.deepEqual(parseRoute(`?ruleset=${mode}&lang=en`), { page: 'game', mode })
  }
  assert.deepEqual(parseRoute('?mode=expert&lang=zh'), { page: 'game', mode: 'classic' })
})

test('menu and mode links resolve under Pages and round-trip without leaking tutorial parameters', () => {
  const original = 'https://example.com/minefarer/?ruleset=classic&mode=expert&tutorial=classic'
  for (const language of ['en', 'zh', 'ja'] as const) {
    for (const page of ['home', 'free', 'story'] as const) {
      const target = new URL(routeHref({ page }, language), original)
      assert.equal(target.pathname, '/minefarer/')
      assert.equal(target.searchParams.get('lang'), language)
      assert.equal(target.searchParams.has('mode'), false)
      assert.equal(target.searchParams.has('tutorial'), false)
      assert.deepEqual(parseRoute(target.search), { page })
    }
    for (const mode of FREE_MODES) {
      const route = { page: 'game', mode } as const
      assert.ok(sameRoute(route, parseRoute(routeHref(route, language))))
    }
  }
  assert.equal(sameRoute({ page: 'home' }, { page: 'free' }), false)
  assert.equal(sameRoute({ page: 'game', mode: 'classic' }, { page: 'game', mode: 'twin' }), false)
})
