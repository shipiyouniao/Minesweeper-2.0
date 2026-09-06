import { generateClock } from './clock-generation.js'
import { forecastClock, clockIntent } from './clock-forecast.js'
import { encounterTier } from './encounter-tiers.js'
import {
  combatStats,
  damageExpedition,
  incomingCombatDamage,
  battleThreat,
} from './combat-build.js'
import { applyDamageRelics } from './relic-effects.js'
import type { Expedition } from '../types/variants.js'
import type { ClockExpedition } from '../types/clock.js'

/** The room replaces coordinates while preserving the expedition's build and spent floor effects. */
export function enterClock(run: Expedition): Expedition {
  const tier = encounterTier(run.departure.difficulty)
  const layout = generateClock(
    { ...tier.config, mines: Math.round(tier.config.width * tier.config.height * 0.17) },
    (run.departure.seed ^ Math.imul(run.floor, 0x85ebca6b)) >>> 0,
  )
  const health = 20 + tier.health * 2
  return forecastClock({
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
      kind: 'clock',
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
      hourglasses: layout.objectives.map((index) => ({ index, used: false })),
      spells: [],
      nextSpell: 1,
      echo: { index: layout.entrance, damage: 0 },
      recoveryUntil: 0,
      resolution: null,
      intent: { kind: 'cross', targets: [], damage: 3 },
    },
  })
}

/** Redirect the earliest hostile deadline, tie-breaking by stable ID; each glass is single-use. */
export function redirectClock(run: ClockExpedition, index: number): Expedition {
  const target = [...run.encounter.spells]
    .filter((spell) => !spell.redirected)
    .sort((a, b) => a.resolvesOn - b.resolvesOn || a.id - b.id)[0]
  if (!target || !run.encounter.hourglasses.some((glass) => glass.index === index && !glass.used))
    return run
  return clockIntent({
    ...run,
    encounter: {
      ...run.encounter,
      event: 'disabled',
      hourglasses: run.encounter.hourglasses.map((glass) =>
        glass.index === index ? { ...glass, used: true } : glass,
      ),
      spells: run.encounter.spells.map((spell) =>
        spell.id === target.id
          ? { ...spell, redirected: true, targets: [run.encounter.boss] }
          : spell,
      ),
    },
  })
}

/** Only explicit end-turn resolves spells. Enemy damage precedes echo/return damage; death wins ties. */
export function advanceClock(run: ClockExpedition): Expedition {
  const e = run.encounter
  const due = e.spells.filter((spell) => spell.resolvesOn === e.turn)
  const raw = battleThreat(e, run.player, run.game.config)
  const damaged = raw
    ? applyDamageRelics(
        run,
        { ...run, ...damageExpedition(run, incomingCombatDamage(run, raw)) },
        null,
      )
    : run
  const alive = damaged.health > 0
  const reflectedDamage = alive
    ? Math.min(e.health, due.filter((spell) => spell.redirected).length * 6)
    : 0
  const echoDamage = alive ? Math.min(e.health - reflectedDamage, e.echo.damage) : 0
  const health = e.health - reflectedDamage - echoDamage
  const next: ClockExpedition = {
    ...damaged,
    phase: alive ? 'boss' : 'lost',
    steps: run.steps + 1,
    encounter: {
      ...e,
      health,
      lastDamage: reflectedDamage + echoDamage,
      turn: e.turn + 1,
      braced: false,
      turnTriggers: [],
      spells: e.spells.filter((spell) => spell.resolvesOn > e.turn),
      echo: { index: run.player, damage: 0 },
      recoveryUntil: reflectedDamage > 0 ? e.turn + 1 : e.recoveryUntil,
      resolution: {
        turn: e.turn,
        cells: due.flatMap((spell) => [...spell.targets]),
        echoIndex: e.echo.index,
        echoDamage,
        reflectedDamage,
      },
      event:
        health === 0
          ? 'defeated'
          : raw > 0
            ? 'hit'
            : reflectedDamage + echoDamage > 0
              ? 'struck'
              : 'evaded',
    },
  }
  const ready = { ...next, encounter: { ...next.encounter, points: combatStats(next).actions } }
  return alive && health > 0 ? forecastClock(ready) : clockIntent(ready)
}
