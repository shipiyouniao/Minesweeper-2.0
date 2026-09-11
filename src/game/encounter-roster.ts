import { shuffled } from './variant-board.js'
import { RECOLLECTION_BOSSES } from './recollection.js'
import { enterMatrix } from './matrix-battle.js'
import { enterTide } from './tide-battle.js'
import { enterEcho } from './echo-battle.js'
import { encounterTier } from './encounter-tiers.js'
import { enterBattle } from './battle-arena.js'
import { enterMirror } from './mirror-battle.js'
import { enterClock } from './clock-battle.js'
import { enterMagnetic } from './magnetic-battle.js'
import type { Expedition } from '../types/variants.js'

/** Place boss rooms at the selected difficulty's authored checkpoints. */
export function isEncounterFloor(run: Expedition): boolean {
  return (
    !run.departure.campaign && encounterTier(run.departure.difficulty).floors.includes(run.floor)
  )
}

/** Rotate eight distinct encounters from a seeded first boss without immediate repeats. */
export function enterEncounter(run: Expedition): Expedition {
  const checkpoint = encounterTier(run.departure.difficulty).floors.indexOf(run.floor)
  const selected = run.departure.recollection
  const pool = selected
    ? shuffled(selected.bosses, run.departure.seed ^ 0xb055)
    : RECOLLECTION_BOSSES
  const kind = pool[(selected ? checkpoint : run.departure.seed + checkpoint) % pool.length]
  if (!kind) throw new Error('An encounter needs a selected boss family')
  const slot = RECOLLECTION_BOSSES.indexOf(kind)
  // Ordinary-room controls must never survive the replacement by a tactical arena.
  const { circuits, power, rail, ...arenaRun } = run
  run = arenaRun
  if (slot === 7) return enterTide(run)

  if (slot === 6) return enterMatrix(run)

  if (slot === 5) return enterEcho(run)

  if (slot === 4) return enterClock(run)

  if (slot === 3) return enterMagnetic(run)

  return slot === 2 ? enterMirror(run) : enterBattle(run, slot === 1 ? 'brood' : 'bastion')
}
