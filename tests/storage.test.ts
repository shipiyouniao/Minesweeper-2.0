import { test } from 'node:test'
import assert from 'node:assert/strict'
import { act, createGame, PRESETS } from '../src/game/engine.js'
import { Repository, difficultyOf, type Score, type StorageLike } from '../src/storage.js'
import { languageOf, translations } from '../src/i18n.js'

class MemoryStorage implements StorageLike {
  data = new Map<string, string>()
  getItem(key: string) { return this.data.get(key) ?? null }
  setItem(key: string, value: string) { this.data.set(key, value) }
  removeItem(key: string) { this.data.delete(key) }
}

test('progress survives round-trip per difficulty and completed games clear their own slot', () => {
  const repo = new Repository(new MemoryStorage())
  let game = act(createGame(PRESETS.easy, 31), { type: 'reveal', index: 40 })
  repo.save('easy', game, 12345)
  repo.save('medium', createGame(PRESETS.medium, 0), 0)
  assert.deepEqual(repo.load('easy'), { game, elapsed: 12345 })
  for (const [index, cell] of game.cells.entries()) if (!cell.mine) game = act(game, { type: 'reveal', index })
  repo.save('easy', game, 13000)
  assert.equal(repo.load('easy'), null)
  assert.equal(repo.load('medium')?.game.config.mines, 40)
})

test('unavailable or corrupt browser storage never stops play', () => {
  const broken: StorageLike = {
    getItem() { throw new Error('disabled') }, setItem() { throw new Error('quota') }, removeItem() { throw new Error('disabled') },
  }
  const repo = new Repository(broken)
  assert.equal(repo.load('easy'), null)
  assert.deepEqual(repo.scores('easy'), [])
  assert.doesNotThrow(() => repo.save('easy', createGame(PRESETS.easy, 0), 0))
  assert.equal(repo.available, false)
  const memory = new MemoryStorage()
  memory.setItem('minesweeper.v3.game.easy', '{invalid')
  assert.equal(new Repository(memory).load('easy'), null)
})

test('leaderboard is numeric, bounded, deduplicated and supports renaming', () => {
  const repo = new Repository(new MemoryStorage())
  for (let i = 15; i > 0; i--) repo.record('easy', { id: String(i), name: `Player ${i}`, milliseconds: i * 1000, date: '2026-09-03T00:00:00Z' })
  const scores = repo.scores('easy')
  assert.equal(scores.length, 10)
  assert.equal(scores[0]?.milliseconds, 1000)
  const first = scores[0] as Score
  repo.record('easy', { ...first, name: 'Renamed' })
  assert.equal(repo.scores('easy').length, 10)
  assert.equal(repo.scores('easy')[0]?.name, 'Renamed')
})

test('legacy local leaderboard is migrated once without deleting the original', () => {
  const storage = new MemoryStorage()
  storage.setItem('MinesweeperRank', JSON.stringify({ easyRank: [{ ID: 'Original player', time: '0h1min30s' }], hardRank: [], extraRank: [] }))
  const repo = new Repository(storage)
  repo.migrateLegacy(); repo.migrateLegacy()
  assert.equal(repo.scores('easy').length, 1)
  assert.equal(repo.scores('easy')[0]?.milliseconds, 90000)
  assert.ok(storage.getItem('MinesweeperRank'))
})

test('old language and difficulty links map to the new edition', () => {
  assert.equal(languageOf('zh_cn'), 'zh')
  assert.equal(languageOf('jp'), 'ja')
  assert.equal(languageOf('en-US'), 'en')
  assert.equal(difficultyOf('hard'), 'medium')
  assert.equal(difficultyOf('extra'), 'expert')
  assert.equal(difficultyOf('bad'), 'easy')
  for (const language of ['en', 'ja'] as const) assert.deepEqual(Object.keys(translations[language]).sort(), Object.keys(translations.zh).sort())
})
