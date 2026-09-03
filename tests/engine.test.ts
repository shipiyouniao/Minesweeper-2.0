import { test } from 'node:test'
import assert from 'node:assert/strict'
import { act, createGame, minePositions, neighbors, PRESETS, restore, snapshot, stats, validConfig, type Game } from '../src/game/engine.js'

function started(seed = 42): Game { return act(createGame(PRESETS.easy, seed), { type: 'reveal', index: 40 }) }

test('all presets: fixed mine count, unique positions, and safe first neighborhood for 120 seeds', () => {
  for (const config of Object.values(PRESETS)) {
    for (let seed = 0; seed < 120; seed++) {
      for (const first of [0, config.width - 1, Math.floor(config.width * config.height / 2), config.width * config.height - 1]) {
        const positions = minePositions(config, first, seed)
        assert.equal(positions.size, config.mines)
        for (const safe of [first, ...neighbors(config, first)]) assert.ok(!positions.has(safe))
        assert.ok([...positions].every(index => index >= 0 && index < config.width * config.height))
      }
    }
  }
})

test('seed reproduces the layout, different seeds vary it, and there is no scan-order concentration', () => {
  assert.deepEqual(minePositions(PRESETS.easy, 40, 0), minePositions(PRESETS.easy, 40, 0))
  assert.notDeepEqual(minePositions(PRESETS.easy, 40, 0), minePositions(PRESETS.easy, 40, 1))
  const frequencies = Array<number>(81).fill(0)
  for (let seed = 0; seed < 1000; seed++) {
    for (const index of minePositions(PRESETS.easy, 40, seed)) frequencies[index] = (frequencies[index] ?? 0) + 1
  }
  const eligible = frequencies.filter(count => count > 0)
  assert.equal(eligible.length, 72)
  // A deterministic, broad regression bound, not a claim of cryptographic randomness.
  assert.ok(Math.max(...eligible) < 190)
  assert.ok(Math.min(...eligible) > 90)
})

test('clues agree with an independent coordinate-counting oracle', () => {
  const game = started()
  for (const [index, cell] of game.cells.entries()) {
    const x = index % game.config.width, y = Math.floor(index / game.config.width)
    const expected = game.cells.filter((other, j) => other.mine && j !== index
      && Math.abs(j % game.config.width - x) <= 1 && Math.abs(Math.floor(j / game.config.width) - y) <= 1).length
    assert.equal(cell.adjacent, expected)
  }
})

test('flags before the first reveal do not generate a board or start a game', () => {
  const initial = createGame(PRESETS.easy, 0)
  const flagged = act(initial, { type: 'flag', index: 40 })
  assert.equal(flagged.phase, 'ready')
  assert.equal(flagged.firstClick, null)
  assert.equal(stats(flagged).flags, 1)
  assert.equal(act(flagged, { type: 'reveal', index: 40 }), flagged)
  assert.equal(act(flagged, { type: 'flag', index: 40 }).cells[40]?.visibility, 'hidden')
  assert.equal(initial.cells[40]?.visibility, 'hidden')
})

test('first reveal opens a zero region, keeps pre-placed flags, and does not mutate the previous state', () => {
  const initial = act(createGame(PRESETS.easy, 9), { type: 'flag', index: 0 })
  for (const cell of initial.cells) Object.freeze(cell)
  Object.freeze(initial.cells)
  Object.freeze(initial)
  const game = act(initial, { type: 'reveal', index: 40 })
  assert.equal(game.cells[40]?.adjacent, 0)
  assert.equal(game.cells[40]?.visibility, 'revealed')
  assert.equal(game.cells[0]?.visibility, 'flagged')
  assert.equal(initial.phase, 'ready')
  assert.ok(stats(game).revealed >= 9)
})

test('all safe squares win the game, with no requirement to place every flag', () => {
  let game = started()
  for (const [index, cell] of game.cells.entries()) if (!cell.mine) game = act(game, { type: 'reveal', index })
  assert.equal(game.phase, 'won')
  assert.equal(stats(game).remaining, 0)
  assert.equal(stats(game).flags, 10)
  assert.equal(act(game, { type: 'flag', index: 0 }), game)
})

test('a mine loses the game and further actions cannot alter it', () => {
  const game = started()
  const index = game.cells.findIndex(cell => cell.mine)
  const lost = act(game, { type: 'reveal', index })
  assert.equal(lost.phase, 'lost')
  assert.equal(lost.exploded, index)
  assert.equal(act(lost, { type: 'reveal', index: 1 }), lost)
})

function chordFixture(): { game: Game; index: number; around: number[] } {
  for (let seed = 0; seed < 100; seed++) {
    const game = started(seed)
    for (const [index, cell] of game.cells.entries()) {
      if (cell.visibility !== 'revealed' || cell.adjacent === 0) continue
      const around = neighbors(game.config, index)
      const safe = around.filter(i => !game.cells[i]?.mine && game.cells[i]?.visibility === 'hidden')
      if (safe.length >= cell.adjacent) return { game, index, around }
    }
  }
  throw new Error('No chord fixture')
}

test('matching correct flags chord-open the remaining neighbors', () => {
  let { game, index, around } = chordFixture()
  assert.equal(act(game, { type: 'chord', index }), game)
  for (const i of around) if (game.cells[i]?.mine) game = act(game, { type: 'flag', index: i })
  const next = act(game, { type: 'chord', index })
  assert.notEqual(next.phase, 'lost')
  for (const i of around) if (!next.cells[i]?.mine) assert.equal(next.cells[i]?.visibility, 'revealed')
})

test('matching the number with incorrect flags can still lose on a chord', () => {
  let { game, index, around } = chordFixture()
  const count = game.cells[index]?.adjacent ?? 0
  const wrong = around.filter(i => !game.cells[i]?.mine && game.cells[i]?.visibility === 'hidden').slice(0, count)
  for (const i of wrong) game = act(game, { type: 'flag', index: i })
  assert.equal(act(game, { type: 'chord', index }).phase, 'lost')
})

test('large empty region uses iterative flood fill', () => {
  const game = act(createGame({ width: 40, height: 30, mines: 1 }, 42), { type: 'reveal', index: 0 })
  assert.equal(game.phase, 'won')
  assert.equal(stats(game).revealed, 1199)
})

test('dense custom boards still guarantee the first neighborhood without a retry loop', () => {
  const game = act(createGame({ width: 5, height: 5, mines: 16 }, 0), { type: 'reveal', index: 12 })
  assert.equal(game.phase, 'won')
  assert.equal(game.cells.filter(cell => cell.mine).length, 16)
})

test('snapshots round-trip and corrupt, completed or mine-revealing snapshots are rejected', () => {
  const game = started(31)
  assert.deepEqual(restore(snapshot(game)), game)
  const initial = createGame(PRESETS.easy, 0)
  assert.deepEqual(restore(snapshot(initial)), initial)
  assert.equal(restore(null), null)
  assert.equal(restore({ config: { width: 10000, height: 10000, mines: 1 } }), null)
  const corrupt = JSON.parse(JSON.stringify(snapshot(game))) as { seed: number; visible: string[] }
  corrupt.visible[game.cells.findIndex(cell => cell.mine)] = 'revealed'
  assert.equal(restore(corrupt), null)
  assert.equal(restore({ ...snapshot(initial), visible: ['revealed'] }), null)
  const lost = act(game, { type: 'reveal', index: game.cells.findIndex(cell => cell.mine) })
  assert.equal(restore(snapshot(lost)), null)
})

test('invalid configurations and indices fail safely', () => {
  assert.equal(validConfig({ width: 5, height: 5, mines: 17 }), false)
  assert.equal(validConfig({ width: 5.5, height: 5, mines: 1 }), false)
  assert.throws(() => createGame({ width: 1, height: 1, mines: 1 }, 0), RangeError)
  const game = started()
  for (const index of [-1, 999, 0.5, NaN]) assert.equal(act(game, { type: 'reveal', index }), game)
})
