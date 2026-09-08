import { combatStats, damageExpedition, incomingCombatDamage } from './combat-build.js'
import { encounterTier } from './encounter-tiers.js'
import { applyDamageRelics } from './relic-effects.js'
import { adjacentSteps } from './variant-board.js'
import { surveyIndices } from './survey-logic.js'
import { generateMatrix } from './matrix-generation.js'
import { activeRegion, matrixCharge, matrixHealthFloor } from './matrix-logic.js'
import type { Expedition } from '../types/variants.js'
import type { MatrixExpedition } from '../types/matrix.js'

/** Enter normal Minesweeper terrain while preserving the expedition's build. */
export function enterMatrix(run: Expedition): Expedition {
  const tier = encounterTier(run.departure.difficulty)
  const config = {
    ...tier.config,
    mines: Math.round(tier.config.width * tier.config.height * 0.19),
  }
  const layout = generateMatrix(config, (run.departure.seed ^ Math.imul(run.floor, 0x6a71)) >>> 0)
  const maxHealth = 18 + tier.health * 3
  const next: MatrixExpedition = {
    ...run,
    game: layout.game,
    walls: layout.walls,
    entrance: layout.entrance,
    exit: layout.boss,
    player: layout.entrance,
    treasures: [],
    collected: [],
    scannedRows: [],
    confirmedMines: [],
    triggeredMines: [],
    surveyedCells: [],
    probeReport: null,
    phase: 'boss',
    travelled: [],
    priorTravel: run.priorTravel + run.travelled.length,
    sonar: { ...run.sonar, readings: [], loan: 0, loanProgress: 0 },
    encounter: {
      kind: 'matrix',
      boss: layout.boss,
      health: maxHealth,
      maxHealth,
      priorDiscoveries: run.confirmedMines.length,
      lastDamage: 0,
      turn: 1,
      points: 3,
      braced: false,
      turnTriggers: [],
      event: 'entered',
      intent: { kind: 'cross', targets: [], damage: 4 },
      regions: layout.regions,
      phase: 1,
      exposed: false,
      collected: [],
      empty: [],
      notes: [],
      lastAttuned: null,
    },
  }
  return forecastMatrix({
    ...next,
    encounter: { ...next.encounter, points: combatStats(next).actions },
  })
}

/** Freeze a player or objective line; retain a known, affordable orthogonal escape. */
function forecastMatrix(run: MatrixExpedition): MatrixExpedition {
  const e = run.encounter
  const axis = e.turn % 2 ? 'row' : 'column'
  const target = e.turn % 4 === 2 ? activeRegion(run).indices[4]! : run.player
  const line =
    axis === 'row' ? Math.floor(target / run.game.config.width) : target % run.game.config.width
  let targets =
    e.turn % 3 === 0
      ? []
      : surveyIndices(run.game.config, axis, line).filter((index) => !run.walls.includes(index))
  const exits = adjacentSteps(run.game, run.player).filter(
    (index) =>
      !run.walls.includes(index) &&
      !run.confirmedMines.includes(index) &&
      run.game.cells[index]?.visibility === 'revealed' &&
      !run.game.cells[index]!.mine,
  )
  // Do not announce an unavoidable hit from a cul-de-sac with no publicly known exit.
  if (targets.includes(run.player) && !exits.some((index) => !targets.includes(index)))
    targets = exits.length ? [run.player] : []
  return { ...run, encounter: { ...e, intent: { kind: axis, targets, damage: 4 } } }
}

/** Resolve an already validated extraction. Hidden identity is read only after AP acceptance. */
export function attuneMatrix(run: MatrixExpedition, index: number): MatrixExpedition {
  const e = run.encounter
  const found = activeRegion(run).crystals.includes(index)
  const collected = found ? [...e.collected, index] : e.collected
  const charged = found && matrixCharge(run) === 1
  return {
    ...run,
    encounter: {
      ...e,
      collected,
      empty: found ? e.empty : [...e.empty, index],
      // Guesses belong to this objective; retire them when its shield breaks.
      notes: charged ? [] : e.notes.filter((note) => note !== index),
      lastAttuned: index,
      exposed: e.exposed || charged,
      event: charged ? 'disabled' : found ? 'matrix-collected' : 'matrix-empty',
    },
  }
}

/** Hypotheses are cancellable and cannot discover or charge anything by themselves. */
export function noteMatrix(run: MatrixExpedition, index: number): MatrixExpedition {
  const e = run.encounter
  const notes = e.notes.includes(index)
    ? e.notes.filter((note) => note !== index)
    : [...e.notes, index]
  return { ...run, encounter: { ...e, notes, event: 'acted' } }
}

/** Shared build damage cannot skip the second crystal objective. */
export function strikeMatrix(run: MatrixExpedition, damage: number): MatrixExpedition {
  const e = run.encounter
  const health = Math.max(matrixHealthFloor(run), e.health - damage)
  return {
    ...run,
    encounter: {
      ...e,
      health,
      lastDamage: e.health - health,
      event: health === 0 ? 'defeated' : 'struck',
    },
  }
}

/** Resolve the frozen attack, then activate the next region only at the health boundary. */
export function advanceMatrix(run: MatrixExpedition): MatrixExpedition {
  const e = run.encounter
  const damage = incomingCombatDamage(
    run,
    e.intent.targets.includes(run.player) ? e.intent.damage : 0,
  )
  const hurt =
    damage > 0 ? applyDamageRelics(run, { ...run, ...damageExpedition(run, damage) }, null) : run
  const shifted = e.phase === 1 && e.health <= matrixHealthFloor(run)
  const next: MatrixExpedition = {
    ...hurt,
    steps: run.steps + 1,
    phase: hurt.health === 0 ? 'lost' : 'boss',
    encounter: {
      ...e,
      turn: e.turn + 1,
      braced: false,
      turnTriggers: [],
      phase: shifted ? 2 : e.phase,
      exposed: shifted ? false : e.exposed,
      event: shifted ? 'matrix-shifted' : damage ? 'hit' : 'evaded',
    },
  }
  if (next.phase === 'lost') return next
  return forecastMatrix({
    ...next,
    encounter: { ...next.encounter, points: combatStats(next).actions },
  })
}
