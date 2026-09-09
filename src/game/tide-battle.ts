import { generateBattle } from './battle-arena.js'
import { combatStats, damageExpedition, incomingCombatDamage } from './combat-build.js'
import { encounterTier } from './encounter-tiers.js'
import { applyDamageRelics } from './relic-effects.js'
import { adjacentSteps } from './variant-board.js'
import { surveyIndices } from './survey-logic.js'
import { anchorArea, shuffleTide } from './tide-shuffle.js'
import type { Expedition } from '../types/variants.js'
import type { TideExpedition } from '../types/tide.js'

/** Show the exact number of explicit end-turn actions remaining until the tide. */
export function tideCountdown(run: TideExpedition): number {
  return 3 - ((run.encounter.turn - 1) % 3)
}

/** Each armor section requires its own countercurrent, regardless of build damage. */
export function tideHealthFloor(run: TideExpedition): number {
  return run.encounter.phase === 1 ? Math.ceil(run.encounter.maxHealth / 2) : 0
}

/** Enter a seeded normal Minesweeper arena, retaining health, equipment and relic effects. */
export function enterTide(run: Expedition): Expedition {
  const tier = encounterTier(run.departure.difficulty)
  const config = {
    ...tier.config,
    mines: Math.round(tier.config.width * tier.config.height * 0.17),
  }
  const layout = generateBattle(
    config,
    (run.departure.seed ^ Math.imul(run.floor, 0x71de)) >>> 0,
    1,
  )
  const maxHealth = 20 + tier.health * 2
  const next: TideExpedition = {
    ...run,
    game: layout.game,
    walls: layout.walls,
    entrance: layout.entrance,
    exit: layout.boss,
    player: layout.entrance,
    travelled: [layout.entrance],
    priorTravel: run.priorTravel + Math.max(0, run.travelled.length - 1),
    treasures: [],
    collected: [],
    scannedRows: [],
    confirmedMines: [],
    triggeredMines: [],
    surveyedCells: [],
    probeReport: null,
    sonar: { ...run.sonar, readings: [], loan: 0, loanProgress: 0 },
    phase: 'boss',
    encounter: {
      kind: 'tide',
      boss: layout.boss,
      core: layout.objectives[0]!,
      anchors: [],
      phase: 1,
      exposed: false,
      cycle: 0,
      permutation: [],
      countercurrent: false,
      health: maxHealth,
      maxHealth,
      priorDiscoveries: run.confirmedMines.length,
      lastDamage: 0,
      turn: 1,
      points: 3,
      braced: false,
      turnTriggers: [],
      event: 'entered',
      intent: { kind: 'row', targets: [], damage: 4 },
    },
  }
  return forecastTide({
    ...next,
    encounter: { ...next.encounter, points: combatStats(next).actions },
  })
}

/** Forecast after terrain moves; every threatened pawn retains a revealed one-step escape. */
function forecastTide(run: TideExpedition): TideExpedition {
  const e = run.encounter
  const axis = e.turn % 2 ? 'row' : 'column'
  const line =
    axis === 'row'
      ? Math.floor(run.player / run.game.config.width)
      : run.player % run.game.config.width
  let targets = surveyIndices(run.game.config, axis, line).filter(
    (index) => !run.walls.includes(index),
  )
  const exits = adjacentSteps(run.game, run.player).filter(
    (index) =>
      !run.walls.includes(index) &&
      !run.confirmedMines.includes(index) &&
      run.game.cells[index]!.visibility === 'revealed' &&
      !run.game.cells[index]!.mine,
  )
  if (!exits.some((index) => !targets.includes(index))) targets = exits.length ? [run.player] : []
  return { ...run, encounter: { ...e, intent: { kind: axis, targets, damage: 4 } } }
}

/** Commit one validated anchor; it remains until the next tide even if the pawn walks away. */
export function anchorTide(run: TideExpedition, index: number): TideExpedition {
  return {
    ...run,
    encounter: {
      ...run.encounter,
      anchors: [...run.encounter.anchors, index],
      event: 'tide-anchored',
    },
  }
}

/** Apply ordinary equipment and relic damage, clamped at the current armor boundary. */
export function strikeTide(run: TideExpedition, damage: number): TideExpedition {
  const e = run.encounter
  const health = Math.max(tideHealthFloor(run), e.health - damage)
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

/** Resolve the old attack first, then tide, then armor transition and the next forecast. */
export function advanceTide(run: TideExpedition): TideExpedition {
  const e = run.encounter
  const damage = incomingCombatDamage(
    run,
    e.intent.targets.includes(run.player) ? e.intent.damage : 0,
  )
  const hurt =
    damage > 0 ? applyDamageRelics(run, { ...run, ...damageExpedition(run, damage) }, null) : run
  let next: TideExpedition = { ...hurt, steps: run.steps + 1, encounter: e }
  if (hurt.health === 0) return { ...next, phase: 'lost', encounter: { ...e, event: 'hit' } }

  const changedPhase = e.phase === 1 && e.health <= tideHealthFloor(run)
  const tide = tideCountdown(run) === 1
  // A tide on the armor-transition turn cannot open both armor sections with one anchor.
  const countercurrent =
    tide &&
    !changedPhase &&
    !e.exposed &&
    e.anchors.some(
      (index) =>
        anchorArea(run.game.config, index).includes(e.core) &&
        run.game.cells[e.core]!.visibility === 'revealed',
    )
  if (tide) next = shuffleTide(next)
  next = {
    ...next,
    encounter: {
      ...next.encounter,
      turn: e.turn + 1,
      braced: false,
      turnTriggers: [],
      phase: changedPhase ? 2 : e.phase,
      exposed: changedPhase ? false : e.exposed || countercurrent,
      cycle: e.cycle + Number(tide),
      anchors: tide ? [] : e.anchors,
      countercurrent: tide ? countercurrent : e.countercurrent,
      event: countercurrent
        ? 'tide-broken'
        : changedPhase
          ? 'tide-armored'
          : tide
            ? 'tide-shuffled'
            : damage
              ? 'hit'
              : 'evaded',
    },
  }
  return forecastTide({
    ...next,
    encounter: { ...next.encounter, points: combatStats(next).actions },
  })
}
