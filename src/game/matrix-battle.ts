import { combatStats, damageExpedition, incomingCombatDamage } from './combat-build.js'
import { encounterTier } from './encounter-tiers.js'
import { applyDamageRelics } from './relic-effects.js'
import { adjacentSteps } from './variant-board.js'
import { surveyIndices } from './survey-logic.js'
import { generateMatrix } from './matrix-generation.js'
import { activePrism, matrixHealthFloor } from './matrix-logic.js'
import type { Expedition } from '../types/variants.js'
import type { MatrixExpedition } from '../types/matrix.js'

/** Enter an independent nonogram arena while preserving the expedition's complete build. */
export function enterMatrix(run: Expedition): Expedition {
  const tier = encounterTier(run.departure.difficulty)
  const config = {
    ...tier.config,
    mines: Math.round(tier.config.width * tier.config.height * 0.28),
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
    surveyedCells: [...new Set([...layout.routes, ...layout.opening])],
    probeReport: null,
    phase: 'boss',
    travelled: [],
    priorTravel: run.priorTravel + run.travelled.length,
    sonar: { ...run.sonar, readings: [] },
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
      rows: layout.rows,
      columns: layout.columns,
      prisms: layout.prisms,
      phase: 1,
      armed: false,
      exposedUntil: 0,
      reflections: 0,
      beam: [],
      returnBeam: [],
      pressure: [],
    },
  }
  return forecastMatrix({
    ...next,
    encounter: { ...next.encounter, points: combatStats(next).actions },
  })
}

/** Freeze a line beam and a player-directed warning with an affordable, publicly safe escape. */
function forecastMatrix(run: MatrixExpedition): MatrixExpedition {
  const e = run.encounter
  const prism = activePrism(run)
  const beam =
    e.exposedUntil < e.turn && e.turn % 3 !== 0
      ? surveyIndices(run.game.config, prism.axis, prism.line)
      : []
  const step = prism.axis === 'row' ? run.game.config.width : 1
  const direction = Math.sign(e.boss - prism.index) * step
  const returnBeam: number[] = []
  for (let index = prism.index; index !== e.boss; index += direction) returnBeam.push(index)
  returnBeam.push(e.boss)
  const axis = e.turn % 2 ? 'row' : 'column'
  const line =
    axis === 'row'
      ? Math.floor(run.player / run.game.config.width)
      : run.player % run.game.config.width
  const aimed = surveyIndices(run.game.config, axis, line)
  const exits = adjacentSteps(run.game, run.player).filter(
    (index) =>
      !run.walls.includes(index) &&
      !run.confirmedMines.includes(index) &&
      (run.game.cells[index]?.visibility === 'revealed' || run.surveyedCells.includes(index)),
  )
  const pressure =
    e.turn % 3 === 0
      ? []
      : exits.some((index) => !aimed.includes(index) && !beam.includes(index))
        ? aimed
        : exits.some((index) => !beam.includes(index))
          ? [run.player]
          : []
  // A forced dead end never gets a lethal beam; the turn remains available for exploration.
  const safeBeam =
    beam.includes(run.player) &&
    !exits.some((index) => !beam.includes(index) && !pressure.includes(index))
      ? []
      : beam
  return {
    ...run,
    encounter: {
      ...e,
      beam: safeBeam,
      returnBeam,
      pressure,
      intent: { kind: 'cross', targets: [...new Set([...safeBeam, ...pressure])], damage: 4 },
    },
  }
}

/** Rotate the calibrated optic; the visible return path is added only by this explicit action. */
export function armMatrix(run: MatrixExpedition): MatrixExpedition {
  const e = run.encounter
  const beam = e.beam.filter((index) => index <= activePrism(run).index)
  return {
    ...run,
    encounter: {
      ...e,
      beam,
      armed: true,
      event: 'disabled',
      intent: { ...e.intent, targets: [...new Set([...beam, ...e.pressure, ...e.returnBeam])] },
    },
  }
}

/** Melee damage uses the shared build but cannot skip a shield circuit. */
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

/** Resolve exactly the displayed forecast, then reflect, advance circuits and refill build AP. */
export function advanceMatrix(run: MatrixExpedition): MatrixExpedition {
  const e = run.encounter
  const damage = incomingCombatDamage(
    run,
    e.intent.targets.includes(run.player) ? e.intent.damage : 0,
  )
  const hurt =
    damage > 0 ? applyDamageRelics(run, { ...run, ...damageExpedition(run, damage) }, null) : run
  const shifted = e.phase < 3 && e.health <= matrixHealthFloor(run)
  const next: MatrixExpedition = {
    ...hurt,
    steps: run.steps + 1,
    phase: hurt.health === 0 ? 'lost' : 'boss',
    encounter: {
      ...e,
      turn: e.turn + 1,
      braced: false,
      turnTriggers: [],
      armed: false,
      phase: e.phase + Number(shifted),
      exposedUntil: shifted ? 0 : e.armed ? e.turn + 4 : e.exposedUntil,
      reflections: e.reflections + Number(e.armed),
      event: shifted ? 'matrix-shifted' : e.armed ? 'matrix-reflected' : damage ? 'hit' : 'evaded',
    },
  }
  if (next.phase === 'lost') return next
  return forecastMatrix({
    ...next,
    encounter: { ...next.encounter, points: combatStats(next).actions },
  })
}
