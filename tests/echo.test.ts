import { echoObscured } from '../src/game/expedition-sonar.js'
import { sonarRegion } from '../src/game/sonar.js'
import { refreshExpeditionReadings } from '../src/game/expedition-sonar.js'
import { enterMirror, shiftMirror } from '../src/game/mirror-battle.js'
import { defeatEcho } from './echo-helpers.js'
import test from 'node:test'
import assert from 'node:assert/strict'
import { CURRENT_DEPARTURE } from './helpers.js'
import { createExpedition, actExpedition, allowedDeparture } from '../src/game/expedition.js'
import { enterEcho } from '../src/game/echo-battle.js'
import {
  echoCandidates,
  useExpeditionSonar,
  rechargeExpeditionSonar,
} from '../src/game/expedition-sonar.js'
import { adjacentSteps } from '../src/game/variant-board.js'
import { tacticalPlan } from '../src/game/tactical-planning.js'
import type { Expedition } from '../src/types/variants.js'

function base(seed = 5): Expedition {
  return createExpedition({ ...CURRENT_DEPARTURE, seed, equipment: ['sonar'] })
}

test('Sonar needs both licenses, opens only its center and confirms mines without injury', () => {
  const camp = { supplies: 0, completed: 0, upgrades: ['workshop'] as const }
  assert.equal(allowedDeparture(camp, 'explorer', ['sonar']), false)
  assert.equal(
    allowedDeparture({ ...camp, upgrades: ['workshop', 'sonar'] }, 'explorer', ['sonar']),
    true,
  )
  const run = base()
  const mine = run.game.cells.findIndex((cell, index) => cell.mine && !run.walls.includes(index))
  const next = actExpedition(run, { type: 'sonar', index: mine })
  assert.equal(next.health, run.health)
  assert.equal(next.sonar.charges, 1)
  assert.equal(next.sonar.progress, 0)
  assert.ok(next.confirmedMines.includes(mine))
  assert.equal(next.game.cells[mine]?.visibility, 'flagged')
  assert.equal(next.game.cells.filter((cell, index) => cell !== run.game.cells[index]).length, 1)
  assert.equal(actExpedition(next, { type: 'sonar', index: mine }), next)
  assert.equal(actExpedition(next, { type: 'flag', index: mine }), next)
})

test('loan localization uses public observations, remains separate and cannot bypass the shell', () => {
  let run = enterEcho(base())
  assert.ok(run.encounter?.kind === 'echo')
  assert.equal(echoCandidates(run).length, 3)
  for (const body of run.encounter.bodies)
    assert.equal(tacticalPlan(run, { type: 'interact', index: body }).reason, 'echo-locate')
  assert.equal(tacticalPlan(run, { type: 'attack' }).allowed, false)
  const bodies = run.encounter.bodies
  for (const body of bodies.slice(0, 2)) {
    if (echoCandidates(run).length === 1) break
    run = useExpeditionSonar(run, body)
  }
  assert.equal(echoCandidates(run).length, 1)
  assert.equal(echoCandidates(run)[0], run.encounter?.boss)
  assert.equal(run.sonar.charges, 2)
  assert.ok(run.sonar.loan < 2)
  assert.ok(run.encounter?.kind === 'echo')
  const changedSecret = {
    ...run,
    encounter: { ...run.encounter, boss: bodies.find((body) => body !== run.encounter?.boss)! },
  }
  assert.deepEqual(echoCandidates(changedSecret), echoCandidates(run))
})

test('safe excavation recharge counts actions once, with separate 12 and 4 action thresholds', () => {
  for (const loan of [false, true]) {
    let before = loan ? enterEcho(base()) : base()
    before = { ...before, sonar: { ...before.sonar, charges: 0, loan: 0 } }
    const threshold = loan ? 4 : 12
    for (let step = 0; step < threshold; step++) {
      const index = before.game.cells.findIndex(
        (cell) => !cell.mine && cell.visibility !== 'revealed',
      )
      const after = {
        ...before,
        game: {
          ...before.game,
          cells: before.game.cells.map((cell, other) =>
            other === index ? { ...cell, visibility: 'revealed' as const } : cell,
          ),
        },
      }
      const scanned = rechargeExpeditionSonar(before, after, { type: 'sonar', index })
      assert.equal(scanned.sonar, before.sonar)
      before = rechargeExpeditionSonar(before, after, { type: 'reveal', index })
      assert.equal(loan ? before.sonar.loan : before.sonar.charges, Number(step === threshold - 1))
    }
  }
})

test('all tiers expose safe routes to all three bodies, with finite public localization', () => {
  for (const difficulty of ['relaxed', 'standard', 'advanced', 'expert', 'abyss'] as const) {
    for (let seed = 0; seed < 30; seed++) {
      const run = enterEcho(createExpedition({ ...CURRENT_DEPARTURE, seed, difficulty }))
      assert.ok(run.encounter?.kind === 'echo')
      assert.equal(run.game.cells.filter((cell) => cell.mine).length, run.game.config.mines)
      const reached = new Set([run.player]),
        queue = [run.player]
      for (const index of queue)
        for (const next of adjacentSteps(run.game, index))
          if (
            !reached.has(next) &&
            !run.walls.includes(next) &&
            (run.surveyedCells.includes(next) || run.game.cells[next]?.visibility === 'revealed')
          ) {
            reached.add(next)
            queue.push(next)
          }
      for (const body of run.encounter.bodies) {
        assert.ok(adjacentSteps(run.game, body).some((index) => reached.has(index)))
        assert.equal(run.game.cells[body]?.mine, false)
      }
      let scanned = run
      for (const body of run.encounter.bodies.slice(0, 2))
        scanned = useExpeditionSonar(scanned, body)
      assert.deepEqual(echoCandidates(scanned), [run.encounter.boss])
    }
  }
})

test('a public-route strategy defeats every phase without health upgrades or unlimited pulses', () => {
  for (const difficulty of ['relaxed', 'standard', 'advanced', 'expert', 'abyss'] as const) {
    for (let seed = 0; seed < 10; seed++) {
      let run = enterEcho(
        createExpedition({
          ...CURRENT_DEPARTURE,
          seed,
          difficulty,
          equipment: [],
          profession: 'explorer',
        }),
      )
      run = defeatEcho(run).reduce(actExpedition, run)
      assert.ok(
        run.phase === 'reward' || run.phase === 'won',
        `${difficulty}/${seed}: ${run.phase}, turn ${run.encounter?.turn}`,
      )
      assert.ok(run.encounter?.kind === 'echo')
      assert.equal(run.encounter.phase, 3)
      assert.ok(run.encounter.pulsesUsed <= 6)
    }
  }
})

test('public detonations update mine totals while a mirror shift preserves each realm observation', () => {
  const run = base()
  const index = run.game.cells.findIndex((cell, index) => cell.mine && !run.walls.includes(index))
  const scanned = useExpeditionSonar(run, index)
  const changed = {
    ...scanned,
    game: {
      ...scanned.game,
      cells: scanned.game.cells.map((cell, other) =>
        other === index ? { ...cell, mine: false } : cell,
      ),
    },
  }
  assert.equal(
    refreshExpeditionReadings(scanned, changed).sonar.readings[0]!.mines,
    scanned.sonar.readings[0]!.mines - 1,
  )
  const mirror = enterMirror(run)
  assert.ok(mirror.encounter?.kind === 'mirror')
  const observed = useExpeditionSonar(mirror, mirror.player)
  assert.ok(observed.encounter?.kind === 'mirror')
  const shifted = shiftMirror({ ...observed, encounter: observed.encounter })
  assert.deepEqual(
    refreshExpeditionReadings(observed, shifted).sonar.readings,
    observed.sonar.readings,
  )
})

test('Echo Sonar clarifies every regional clue without opening neighboring cells', () => {
  const run = enterEcho(base())
  const center = run.game.cells.findIndex(
    (cell, index) => !cell.mine && !run.walls.includes(index) && cell.visibility === 'hidden',
  )
  const scanned = useExpeditionSonar(run, center)
  assert.equal(scanned.game.cells[center]?.visibility, 'revealed')
  for (const index of sonarRegion(run.game.config, center)) {
    if (index !== center)
      assert.equal(scanned.game.cells[index]?.visibility, run.game.cells[index]?.visibility)
    const opened = {
      ...scanned,
      game: {
        ...scanned.game,
        cells: scanned.game.cells.map((cell, other) =>
          other === index ? { ...cell, visibility: 'revealed' as const } : cell,
        ),
      },
    }
    assert.equal(echoObscured(opened, index), false)
  }
})

test('a safe exit excavation recharges owned Sonar before every boss entry, never its loan', () => {
  for (let seed = 0; seed < 6; seed++) {
    const initial = base(seed)
    const player = adjacentSteps(initial.game, initial.exit).find(
      (index) => !initial.walls.includes(index) && !initial.game.cells[index]!.mine,
    )!
    assert.notEqual(player, undefined)
    const run: Expedition = {
      ...initial,
      floor: 3,
      player,
      sonar: { ...initial.sonar, charges: 0, progress: 11 },
      game: {
        ...initial.game,
        cells: initial.game.cells.map((cell, index) =>
          index === initial.exit
            ? { ...cell, visibility: 'hidden' }
            : index === player
              ? { ...cell, visibility: 'revealed' }
              : cell,
        ),
      },
    }
    const entered = actExpedition(run, { type: 'reveal', index: run.exit })
    assert.equal(entered.phase, 'boss')
    assert.equal(entered.sonar.charges, 1)
    assert.equal(entered.sonar.progress, 0)
    assert.equal(entered.sonar.loan, entered.encounter?.kind === 'echo' ? 2 : 0)
    assert.equal(entered.sonar.loanProgress, 0)
    const opened: Expedition = {
      ...run,
      game: {
        ...run.game,
        cells: run.game.cells.map((cell, index) =>
          index === run.exit ? { ...cell, visibility: 'revealed' } : cell,
        ),
      },
    }
    const walked = actExpedition(opened, { type: 'move', index: run.exit })
    assert.equal(walked.phase, 'boss')
    assert.equal(walked.sonar.charges, 0)
    assert.equal(walked.sonar.progress, 11)
  }
})
