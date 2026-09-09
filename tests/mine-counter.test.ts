import assert from 'node:assert/strict'
import test from 'node:test'
import { act, createGame } from '../src/game/engine.js'
import { actSonar, createSonar } from '../src/game/sonar.js'
import { actSurvey, createSurvey } from '../src/game/survey.js'
import { actTwin, createTwin } from '../src/game/twin.js'
import { remainingMines, mineCounterTemplate } from '../src/ui/mine-counter.js'

/** Read the visible counter values from rendered templates, in board order. */
function counts(html: string): number[] {
  return [...html.matchAll(/data-mine-count>(-?\d+)</g)].map((match) => Number(match[1]))
}

test('Remaining mines count flags, including wrong guesses, but never safe notes or hidden truth', () => {
  let game = createGame({ width: 5, height: 5, mines: 2 }, 7)
  assert.equal(remainingMines(game), 2)
  for (const index of [0, 1, 2]) game = act(game, { type: 'flag', index })
  assert.equal(remainingMines(game), -1)
  assert.deepEqual(counts(mineCounterTemplate('en', game)), [-1])

  game = act(game, { type: 'mark-safe', index: 2 })
  assert.equal(remainingMines(game), 0)
  game = act(game, { type: 'mark-safe', index: 2 })
  assert.equal(remainingMines(game), 0)
  game = act(game, { type: 'flag', index: 0 })
  assert.equal(remainingMines(game), 1)

  // A different hidden mine layout cannot change the public counter or certify a flag.
  const different = {
    ...game,
    cells: game.cells.map((cell, index) => ({ ...cell, mine: index === 5 || index === 6 })),
  }
  assert.equal(mineCounterTemplate('en', game), mineCounterTemplate('en', different))
})

test('Twin board counters remain independent after flags and safe notes on either side', () => {
  let twin = actTwin(createTwin(7, 'standard'), { type: 'reveal', side: 'a', index: 0 })
  const a = twin.a.cells.findIndex((cell) => cell.visibility === 'hidden')
  const b = twin.b.cells.findIndex((cell) => cell.visibility === 'hidden')
  twin = actTwin(twin, { type: 'flag', side: 'a', index: a })
  assert.deepEqual(
    [remainingMines(twin.a), remainingMines(twin.b)],
    [twin.a.config.mines - 1, twin.b.config.mines],
  )
  twin = actTwin(twin, { type: 'flag', side: 'b', index: b })
  twin = actTwin(twin, { type: 'mark-safe', side: 'a', index: a })
  assert.deepEqual(
    [remainingMines(twin.a), remainingMines(twin.b)],
    [twin.a.config.mines, twin.b.config.mines - 1],
  )
})

test('Sonar discoveries and Survey flags update the same localized board counter', () => {
  let sonar = actSonar(createSonar(7), { type: 'reveal', index: 40 })
  const mine = sonar.game.cells.findIndex((cell) => cell.mine)
  sonar = actSonar(sonar, { type: 'scan', index: mine })
  assert.equal(remainingMines(sonar.game), sonar.game.config.mines - 1)
  const repeated = actSonar(sonar, { type: 'scan', index: mine })
  assert.equal(remainingMines(repeated.game), remainingMines(sonar.game))

  let survey = createSurvey(7)
  const hidden = survey.game.cells.findIndex((cell) => cell.visibility === 'hidden')
  survey = actSurvey(survey, { type: 'flag', index: hidden })
  for (const language of ['en', 'zh', 'ja'] as const) {
    assert.deepEqual(counts(mineCounterTemplate(language, sonar.game)), [
      sonar.game.config.mines - 1,
    ])
    assert.deepEqual(counts(mineCounterTemplate(language, survey.game)), [
      survey.game.config.mines - 1,
    ])
  }
})
