import { clueIsolated } from './clue-isolation.js'
import { railObjectiveComplete } from './floor-rail.js'
import { powerObjectiveComplete } from './floor-power.js'
import { walkingPath } from './dungeon-path.js'
import { recordTravel } from './exploration-relics.js'
import type { FloorRelay } from '../types/floor-circuits.js'
import type { Expedition } from '../types/variants.js'

/** Read only visible clues and player marks; a relay never leaks hidden mine truth. */
export function relayReady(run: Expedition, relay: FloorRelay): boolean {
  return relay.active && clueIsolated(run, relay.index)
}

/** Closing circuits is an explicit physical action, independent of flag placement. */
export function interactRelay(run: Expedition, index: number): Expedition {
  const circuits = run.circuits
  const relay = circuits?.relays.find((entry) => entry.index === index && entry.active)
  if (!circuits || !relay || !relayReady(run, relay)) return run
  const path = walkingPath(run, index)
  if (!path) return run

  return recordTravel(
    {
      ...run,
      player: index,
      steps: run.steps + 1,
      walls: run.walls.filter((wall) => wall !== relay.gate),
      circuits: {
        ...circuits,
        relays: circuits.relays.map((entry) =>
          entry === relay ? { ...entry, active: false } : entry,
        ),
      },
      // A released gate is visibly safe but does not flood the room behind it.
      game: {
        ...run.game,
        cells: run.game.cells.map((cell, target) =>
          target === relay.gate ? { ...cell, visibility: 'revealed' } : cell,
        ),
      },
    },
    path,
  )
}

/** Optional discoveries are carried to later floors only after physically reaching them. */
export function collectSignalRecord(run: Expedition, path: readonly number[]): Expedition {
  const circuits = run.circuits
  if (
    !circuits ||
    circuits.record === null ||
    circuits.recordTaken ||
    !path.includes(circuits.record)
  )
    return run
  return { ...run, signalRecord: true, circuits: { ...circuits, recordTaken: true } }
}

/** Exit rules use mechanism outcomes instead of requiring every optional collectible. */
export function floorObjectiveComplete(run: Expedition): boolean {
  if (run.rail) return railObjectiveComplete(run.rail)
  if (run.power) return powerObjectiveComplete(run.power)
  if (run.circuits) return run.circuits.relays.every((relay) => relay.optional || !relay.active)
  return !run.departure.campaign || run.treasures.every((index) => run.collected.includes(index))
}
