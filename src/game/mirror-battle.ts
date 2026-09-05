import { encounterTier } from './encounter-tiers.js'
import { combatStats } from './combat-build.js'
import { generateMirror } from './mirror-generation.js'
import { mirrorRoom, oppositeMirror } from './mirror-state.js'
import type { Expedition } from '../types/variants.js'
import type { MirrorExpedition, MirrorSide, MirrorRoom } from '../types/mirror.js'
import type { TacticalIntent } from '../types/tactical.js'

/** Dawn cuts rows and columns; Dusk cuts diagonals, with every footprint frozen for the turn. */
function mirrorIntent(
  room: MirrorRoom,
  side: MirrorSide,
  turn: number,
  damage: number,
): TacticalIntent {
  // A shared third-turn recharge guarantees attack opportunities even in narrow numbered lanes.
  if (turn % 3 === 0) return { kind: 'row', targets: [], damage: 0 }
  const beat = turn - Math.floor(turn / 3)
  const width = room.game.config.width
  const x = room.player % width
  const y = Math.floor(room.player / width)
  const targets = room.game.cells.flatMap((_, index) => {
    if (room.walls.includes(index)) return []
    const dx = (index % width) - x
    const dy = Math.floor(index / width) - y
    const hit =
      side === 'dawn' ? (beat % 2 ? dy === 0 : dx === 0) : beat % 2 ? dx === dy : dx === -dy
    return hit ? [index] : []
  })
  return { kind: side === 'dawn' ? (beat % 2 ? 'row' : 'column') : 'cross', targets, damage }
}

/** Snapshot both enemies together; later moves or switches cannot retarget either attack. */
export function forecastMirror(run: MirrorExpedition): MirrorExpedition {
  const encounter = run.encounter
  const opposite = oppositeMirror(encounter.active)
  const activeAlive = encounter[encounter.active].health > 0
  const otherAlive = encounter[opposite].health > 0
  const damage = activeAlive && otherAlive ? 5 : 7
  return {
    ...run,
    encounter: {
      ...encounter,
      intent: activeAlive
        ? mirrorIntent(mirrorRoom(run), encounter.active, encounter.turn, damage)
        : { kind: 'row', targets: [], damage: 0 },
      otherIntent: otherAlive
        ? mirrorIntent(encounter.other, opposite, encounter.turn, damage)
        : { kind: 'row', targets: [], damage: 0 },
    },
  }
}

/** Enter two verified realms with shared inventory, floor triggers and combat growth. */
export function enterMirror(run: Expedition): Expedition {
  const tier = encounterTier(run.departure.difficulty)
  const config = {
    ...tier.config,
    mines: Math.round(tier.config.width * tier.config.height * 0.17),
  }
  const layout = generateMirror(
    config,
    (run.departure.seed ^ Math.imul(run.floor, 0x85ebca6b)) >>> 0,
  )
  const health = 10 + tier.health
  return forecastMirror({
    ...run,
    ...layout.dawn,
    entrance: layout.entrance,
    exit: layout.boss,
    priorTravel: run.priorTravel + Math.max(0, run.travelled.length - 1),
    treasures: [],
    collected: [],
    phase: 'boss',
    encounter: {
      kind: 'mirror',
      active: 'dawn',
      other: layout.dusk,
      dawn: { health, maxHealth: health, seal: { index: layout.dawnSeal, active: true } },
      dusk: { health, maxHealth: health, seal: { index: layout.duskSeal, active: true } },
      priorDiscoveries: run.confirmedMines.length,
      boss: layout.boss,
      health: health * 2,
      maxHealth: health * 2,
      lastDamage: 0,
      lastStruck: null,
      turn: 1,
      points: combatStats(run).actions,
      braced: false,
      turnTriggers: [],
      event: 'entered',
      intent: { kind: 'row', targets: [], damage: 0 },
      otherIntent: { kind: 'row', targets: [], damage: 0 },
    },
  })
}

/** Resume the parked explorer; swapping rooms never duplicates loot, travel or skill charges. */
export function shiftMirror(run: MirrorExpedition): Expedition {
  const encounter = run.encounter
  return {
    ...run,
    ...encounter.other,
    encounter: {
      ...encounter,
      active: oppositeMirror(encounter.active),
      other: mirrorRoom(run),
      intent: encounter.otherIntent,
      otherIntent: encounter.intent,
      event: 'shifted',
    },
  }
}

/** Disable this realm's seal permanently, exposing the partner in the opposite realm. */
export function disableMirrorSeal(run: MirrorExpedition): Expedition {
  const encounter = run.encounter
  const twin = encounter[encounter.active]
  return {
    ...run,
    encounter: {
      ...encounter,
      [encounter.active]: { ...twin, seal: { ...twin.seal, active: false } },
      event: 'disabled',
    },
  }
}

/** Alternate targets while both live; the survivor loses reflection but gains stronger future attacks. */
export function strikeMirror(run: MirrorExpedition, damage: number): Expedition {
  const encounter = run.encounter
  const twin = encounter[encounter.active]
  const health = Math.max(0, twin.health - damage)
  const lastDamage = twin.health - health
  const total = encounter.health - lastDamage
  return {
    ...run,
    encounter: {
      ...encounter,
      [encounter.active]: { ...twin, health },
      health: total,
      lastDamage,
      lastStruck: encounter.active,
      // A defeated source cannot complete its already announced attack.
      intent: health === 0 ? { ...encounter.intent, targets: [], damage: 0 } : encounter.intent,
      event: total === 0 ? 'defeated' : health === 0 ? 'twin-fallen' : 'struck',
    },
  }
}

/** Refill shared AP only at explicit end turn, then announce both future attacks. */
export function advanceMirror(run: MirrorExpedition): Expedition {
  return forecastMirror({
    ...run,
    encounter: {
      ...run.encounter,
      turn: run.encounter.turn + 1,
      points: combatStats(run).actions,
      braced: false,
      turnTriggers: [],
    },
  })
}
