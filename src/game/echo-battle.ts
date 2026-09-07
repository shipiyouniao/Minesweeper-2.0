import { generateClock } from './clock-generation.js'
import { encounterTier } from './encounter-tiers.js'
import { adjacentSteps, shuffled } from './variant-board.js'
import { combatStats, damageExpedition, incomingCombatDamage } from './combat-build.js'
import { applyDamageRelics } from './relic-effects.js'
import { echoCandidates } from './expedition-sonar.js'
import type { Expedition } from '../types/variants.js'
import type { EchoExpedition } from '../types/echo.js'

/** Keep all bodies visually equivalent and connect each approach through publicly marked safe routes. */
export function enterEcho(run: Expedition): Expedition {
  const tier = encounterTier(run.departure.difficulty)
  const config = {
    ...tier.config,
    mines: Math.round(tier.config.width * tier.config.height * 0.17),
  }
  for (let attempt = 0; attempt < 32; attempt++) {
    const seed =
      (run.departure.seed ^ Math.imul(run.floor, 0x51a7) ^ Math.imul(attempt, 0x45d9f3b)) >>> 0
    const layout = generateClock(config, seed)
    const bodies = [layout.boss]
    for (const index of shuffled(
      layout.game.cells.flatMap((cell, index) =>
        !cell.mine && !layout.walls.includes(index) && cell.visibility === 'hidden' ? [index] : [],
      ),
      seed,
    )) {
      if (
        bodies.every(
          (body) =>
            Math.max(
              Math.abs((body % config.width) - (index % config.width)),
              Math.abs(Math.floor(body / config.width) - Math.floor(index / config.width)),
            ) >= 3,
        )
      )
        bodies.push(index)
      if (bodies.length === 3) break
    }
    if (bodies.length !== 3) continue
    const parent = new Map<number, number>([[layout.entrance, layout.entrance]])
    const queue = [layout.entrance]
    for (const index of queue)
      for (const next of adjacentSteps(layout.game, index))
        if (
          !parent.has(next) &&
          !bodies.includes(next) &&
          !layout.walls.includes(next) &&
          !layout.game.cells[next]!.mine
        ) {
          parent.set(next, index)
          queue.push(next)
        }
    const approaches = bodies.map((body) =>
      adjacentSteps(layout.game, body).find((index) => parent.has(index)),
    )
    if (approaches.some((index) => index === undefined)) continue
    const safeRoute = new Set<number>()
    for (const target of approaches) {
      let cursor = target!
      while (cursor !== layout.entrance) {
        safeRoute.add(cursor)
        cursor = parent.get(cursor)!
      }
    }
    const health = 18 + tier.health * 2
    const echo: EchoExpedition = {
      ...run,
      game: layout.game,
      walls: [...new Set([...layout.walls, ...bodies])],
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
      surveyedCells: [...safeRoute],
      probeReport: null,
      sonar: { ...run.sonar, loan: 2, loanProgress: 0, readings: [] },
      phase: 'boss',
      encounter: {
        kind: 'echo',
        priorDiscoveries: run.confirmedMines.length,
        bodies,
        boss: bodies[seed % 3]!,
        health,
        maxHealth: health,
        lastDamage: 0,
        turn: 1,
        points: combatStats(run).actions,
        braced: false,
        turnTriggers: [],
        event: 'entered',
        intent: { kind: 'row', targets: [], damage: 4 },
        phase: 1,
        exposedUntil: 0,
        phaseDamage: 0,
        relocations: 0,
        pulsesUsed: 0,
        sonicHits: 0,
      },
    }
    return forecastEcho(echo)
  }
  throw new Error('No connected Echo arena for this tier')
}

/** Freeze a sonic lane through the player's current square, retaining a known one-step refuge. */
function forecastEcho(run: EchoExpedition): EchoExpedition {
  if (run.encounter.turn % 3 === 0)
    return {
      ...run,
      encounter: { ...run.encounter, intent: { kind: 'row', targets: [], damage: 0 } },
    }
  const horizontal = run.encounter.turn % 2 === 1
  let targets = run.game.cells.flatMap((_, index) =>
    (
      horizontal
        ? Math.floor(index / run.game.config.width) ===
          Math.floor(run.player / run.game.config.width)
        : index % run.game.config.width === run.player % run.game.config.width
    )
      ? [index]
      : [],
  )
  const safe = adjacentSteps(run.game, run.player).filter(
    (index) =>
      !run.walls.includes(index) &&
      (run.game.cells[index]?.visibility === 'revealed' || run.surveyedCells.includes(index)) &&
      !run.confirmedMines.includes(index),
  )
  if (!safe.some((index) => !targets.includes(index))) targets = safe.length ? [run.player] : []
  return {
    ...run,
    encounter: {
      ...run.encounter,
      intent: { kind: horizontal ? 'row' : 'column', targets, damage: 4 },
    },
  }
}

/** Only a uniquely localized, approached body can open the shared attack window. */
export function openEcho(run: EchoExpedition, index: number): Expedition {
  const candidates = echoCandidates(run)
  if (
    candidates.length !== 1 ||
    candidates[0] !== index ||
    !adjacentSteps(run.game, run.player).includes(index) ||
    run.encounter.exposedUntil >= run.encounter.turn
  )
    return run
  return {
    ...run,
    encounter: { ...run.encounter, exposedUntil: run.encounter.turn + 2, event: 'window-opened' },
  }
}

/** Damage is bounded by phase health bands, so each localization phase remains meaningful. */
export function strikeEcho(run: EchoExpedition, damage: number): Expedition {
  const e = run.encounter
  const floor = e.phase < 3 ? Math.ceil((e.maxHealth * (3 - e.phase)) / 3) : 0
  const health = Math.max(floor, e.health - damage)
  return {
    ...run,
    encounter: {
      ...e,
      health,
      lastDamage: e.health - health,
      phaseDamage: e.phaseDamage + e.health - health,
      event: health === 0 ? 'defeated' : 'struck',
    },
  }
}

/** Resolve the announced lane; relocate only at an announced phase boundary after its health band breaks. */
export function advanceEcho(run: EchoExpedition): Expedition {
  const e = run.encounter
  const damage = incomingCombatDamage(
    run,
    e.intent.targets.includes(run.player) ? e.intent.damage : 0,
  )
  const next = damage
    ? applyDamageRelics(run, { ...run, ...damageExpedition(run, damage) }, null)
    : run
  const moved = e.phase < 3 && e.health <= Math.ceil((e.maxHealth * (3 - e.phase)) / 3)
  const phase = e.phase + Number(moved)
  const advanced: EchoExpedition = {
    ...next,
    steps: run.steps + 1,
    phase: next.health > 0 ? 'boss' : 'lost',
    sonar: { ...next.sonar, loan: moved ? Math.max(2, next.sonar.loan) : next.sonar.loan },
    encounter: {
      ...e,
      turn: e.turn + 1,
      braced: false,
      turnTriggers: [],
      phase,
      phaseDamage: moved ? 0 : e.phaseDamage,
      relocations: e.relocations + Number(moved),
      boss: moved
        ? e.bodies[(e.bodies.indexOf(e.boss) + 1 + ((run.departure.seed + phase) % 2)) % 3]!
        : e.boss,
      exposedUntil: moved ? 0 : e.exposedUntil,
      sonicHits: e.sonicHits + Number(damage > 0),
      event: moved ? 'echo-shifted' : damage ? 'hit' : 'evaded',
    },
  }
  if (next.health === 0) return advanced
  return forecastEcho({
    ...advanced,
    encounter: { ...advanced.encounter, points: combatStats(advanced).actions },
  })
}
