import { encounterTier } from './encounter-tiers.js'
import { generateMagnetic } from './magnetic-generation.js'
import { magneticForecast, magneticLurePath, magneticProjection } from './magnetic-field.js'
import { combatStats, damageExpedition, incomingCombatDamage } from './combat-build.js'
import { applyDamageRelics } from './relic-effects.js'
import { recordTravel } from './exploration-relics.js'
import { inspectArea } from './dungeon-discovery.js'
import { revealDungeon } from './dungeon-reveal.js'
import { neighbors, act } from './engine.js'
import type { Expedition } from '../types/variants.js'
import type { MagneticExpedition, MagneticResolution } from '../types/magnetic.js'

/** Freeze the next field and its public footprint, independently of cursor and tool previews. */
function forecastRun(run: MagneticExpedition): MagneticExpedition {
  const encounter = {
    ...run.encounter,
    forecast: magneticForecast(run.encounter.turn, run.encounter.exposedUntil),
  }
  const draft = { ...run, encounter }
  const targets = run.game.cells.flatMap((_, index) => {
    if (run.walls.includes(index)) return []
    const projection = magneticProjection(draft, index)
    return projection.path.length > 1 || projection.collision ? [index] : []
  })

  return { ...draft, encounter: { ...encounter, intent: { kind: 'cross', targets, damage: 0 } } }
}

/** Keep paid gear, earned relics and spent floor effects while replacing only the encounter room. */
export function enterMagnetic(run: Expedition): Expedition {
  const tier = encounterTier(run.departure.difficulty)
  const config = {
    ...tier.config,
    mines: Math.round(tier.config.width * tier.config.height * 0.17),
  }
  const layout = generateMagnetic(
    config,
    (run.departure.seed ^ Math.imul(run.floor, 0x85ebca6b)) >>> 0,
  )
  const health = 20 + tier.health * 2

  return forecastRun({
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
    phase: 'boss',
    encounter: {
      kind: 'magnetic',
      priorDiscoveries: run.confirmedMines.length,
      boss: layout.boss,
      health,
      maxHealth: health,
      lastDamage: 0,
      turn: 1,
      points: combatStats(run).actions,
      braced: false,
      turnTriggers: [],
      event: 'entered',
      anchors: layout.objectives.map((index) => ({ index, calibrated: false })),
      forecast: { kind: 'recovery' },
      exposedUntil: 0,
      resolution: null,
      intent: { kind: 'cross', targets: [], damage: 0 },
    },
  })
}

/** Calibrate once from real flags, then commit a reusable lure along the known route. */
export function lureMagnetic(run: MagneticExpedition, index: number): Expedition {
  const anchor = run.encounter.anchors.find((entry) => entry.index === index)
  const path = magneticLurePath(run, index)
  if (!anchor || !path) return run
  if (
    !anchor.calibrated &&
    !neighbors(run.game.config, index).every((other) => {
      const cell = run.game.cells[other]!
      return cell.mine === (cell.visibility === 'flagged')
    })
  )
    return { ...injureMagnetic(run, 5, null), encounter: { ...run.encounter, event: 'misfire' } }

  const discovered = anchor.calibrated ? run : inspectArea(run, neighbors(run.game.config, index))
  return {
    ...discovered,
    encounter: {
      ...run.encounter,
      anchors: run.encounter.anchors.map((entry) =>
        entry.index === index ? { ...entry, calibrated: true } : entry,
      ),
      forecast: { kind: 'charge', anchor: index, path },
      intent: { kind: 'cross', targets: path.slice(1), damage: 5 },
      event: anchor.calibrated ? 'magnet-lured' : 'disabled',
    },
  }
}

/** Retain shield absorption, revival and damage-triggered information for every physical injury. */
function injureMagnetic(run: Expedition, amount: number, mine: number | null): Expedition {
  const reacted = applyDamageRelics(run, { ...run, ...damageExpedition(run, amount) }, mine)
  return { ...reacted, phase: reacted.health > 0 ? 'boss' : 'lost' }
}

/** Resolve only the cells actually crossed; a mine stops the pawn before the hazard. */
function resolveField(run: MagneticExpedition): Expedition {
  const projection = magneticProjection(run)
  let next: Expedition = run
  const path = [run.player]
  let impact: number | null = null
  for (const index of projection.path.slice(1)) {
    const cell = next.game.cells[index]!
    if (cell.mine) {
      next = injureMagnetic(next, 5, index)
      next = {
        ...next,
        triggeredMines: [...new Set([...next.triggeredMines, index])],
        confirmedMines: [...new Set([...next.confirmedMines, index])],
        game: cell.visibility === 'flagged' ? next.game : act(next.game, { type: 'flag', index }),
      }
      impact = index
      break
    }
    // An ordinary flag is a hypothesis, not a physical barrier to forced movement.
    const game = cell.visibility === 'flagged' ? act(next.game, { type: 'flag', index }) : next.game
    next = { ...next, game: revealDungeon({ ...next, game }, index), player: index }
    path.push(index)
  }
  if (impact === null && projection.collision) {
    next = injureMagnetic(next, incomingCombatDamage(next, 3), null)
    impact = next.player
  }
  next = recordTravel(next, path)
  const outcome =
    impact !== null
      ? 'collision'
      : projection.anchored
        ? 'grounded'
        : path.length > 1
          ? 'shifted'
          : 'recovered'
  return finishTurn(next, run, {
    turn: run.encounter.turn,
    playerPath: path,
    bossPath: [run.encounter.boss],
    impact,
    outcome,
  })
}

/** Commit the advertised charge; an occupied endpoint blocks the crash instead of trapping a pawn. */
function resolveCharge(run: MagneticExpedition): Expedition {
  const { encounter } = run
  if (encounter.forecast.kind !== 'charge') return run
  const { path, anchor } = encounter.forecast
  const hit = path.slice(1).includes(run.player)
  let next: Expedition = hit ? injureMagnetic(run, incomingCombatDamage(run, 5), null) : run
  const blocked = run.player === anchor
  const bossPath = blocked ? [...path.slice(0, -1), ...path.slice(0, -2).reverse()] : path
  if (!blocked) {
    const cells = next.game.cells.map((cell, index) =>
      index === encounter.boss ? { ...cell, visibility: 'revealed' as const } : cell,
    )
    next = {
      ...next,
      game: { ...next.game, cells },
      walls: [...run.walls.filter((index) => index !== encounter.boss), anchor],
      exit: anchor,
      encounter: {
        ...encounter,
        boss: anchor,
        health: Math.max(1, encounter.health - 6),
        lastDamage: Math.min(6, encounter.health - 1),
        exposedUntil: encounter.turn + 3,
      },
    }
  }

  return finishTurn(next, run, {
    turn: encounter.turn,
    playerPath: [run.player],
    bossPath,
    impact: blocked ? run.player : anchor,
    outcome: blocked ? 'collision' : 'overloaded',
  })
}

/** Reset AP exactly once, preserving damage reactions and a presentation-only resolution record. */
function finishTurn(
  next: Expedition,
  before: MagneticExpedition,
  resolution: MagneticResolution,
): Expedition {
  const encounter = next.encounter
  if (encounter?.kind !== 'magnetic') return next
  const result: MagneticExpedition = {
    ...next,
    steps: before.steps + 1,
    encounter: {
      ...encounter,
      turn: encounter.turn + 1,
      braced: false,
      turnTriggers: [],
      resolution,
      event:
        resolution.outcome === 'overloaded'
          ? 'magnet-overloaded'
          : next.health < before.health || next.shields < before.shields
            ? 'hit'
            : resolution.outcome === 'grounded'
              ? 'magnet-grounded'
              : 'evaded',
    },
  }
  const forecast = forecastRun(result)
  return {
    ...forecast,
    encounter: { ...forecast.encounter, points: combatStats(forecast).actions },
  }
}

/** End-turn is the only clock; pauses, previews and animation frames never advance combat. */
export function advanceMagnetic(run: MagneticExpedition): Expedition {
  if (run.encounter.forecast.kind === 'charge') return resolveCharge(run)
  return resolveField(run)
}
