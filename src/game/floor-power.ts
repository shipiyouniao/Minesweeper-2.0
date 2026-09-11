import { clueIsolated } from './clue-isolation.js'
import { walkingPath } from './dungeon-path.js'
import { recordTravel } from './exploration-relics.js'
import type { FloorPower, PowerFeed, PowerReadiness } from '../types/floor-power.js'
import type { Expedition } from '../types/variants.js'

/** Follow upstream selectors; a malformed cycle cannot energize itself. */
export function feedPowered(power: FloorPower, feed: PowerFeed): boolean {
  let input: PowerFeed | null = feed
  const visited = new Set<number>()
  while (input) {
    if (visited.has(input.junction)) return false

    visited.add(input.junction)

    const junction = power.junctions.find((entry) => entry.index === input?.junction)
    if (!junction || junction.selected !== input.branch) return false

    input = junction.input
  }

  return true
}

/** Recognize physical controls without making a hidden clue public. */
export function powerControl(run: Expedition, index: number): boolean {
  return (
    !!run.power &&
    (run.power.junctions.some((entry) => entry.index === index) ||
      run.power.receivers.some((entry) => entry.index === index && !entry.recorded))
  )
}

/** Explain a control using only its public clue and the visible routing state. */
export function powerReadiness(run: Expedition, index: number): PowerReadiness {
  const power = run.power
  if (!power || run.game.cells[index]?.visibility !== 'revealed') return 'covered'

  const junction = power.junctions.find((entry) => entry.index === index)
  const receiver = power.receivers.find((entry) => entry.index === index)
  if (receiver?.recorded) return 'recorded'

  const input = junction?.input ?? receiver?.input
  if (input && !feedPowered(power, input)) return 'unpowered'

  if (junction?.selected !== null && junction?.selected !== undefined) return 'ready'

  return clueIsolated(run, index) ? 'ready' : 'clue'
}

/** Doors are safe terrain. Reveal the doorway itself, leaving the next room for exploration. */
function routeDoors(run: Expedition, power: FloorPower): Expedition {
  const doors = new Set(power.doors.map((entry) => entry.index))
  const closed = power.doors.filter((entry) => !feedPowered(power, entry.input))

  return {
    ...run,
    power,
    walls: [
      ...run.walls.filter((index) => !doors.has(index)),
      ...closed.map((entry) => entry.index),
    ],
    game: {
      ...run.game,
      cells: run.game.cells.map((cell, index) =>
        doors.has(index) && !closed.some((entry) => entry.index === index)
          ? { ...cell, visibility: 'revealed' }
          : cell,
      ),
    },
  }
}

/** Walk to a solved control before switching power or permanently recording its reading. */
export function interactPower(run: Expedition, index: number): Expedition {
  if (!run.power || !powerControl(run, index) || powerReadiness(run, index) !== 'ready') return run

  const path = walkingPath(run, index)
  if (!path) return run

  const junction = run.power.junctions.find((entry) => entry.index === index)
  const power: FloorPower = junction
    ? {
        ...run.power,
        junctions: run.power.junctions.map((entry) =>
          entry !== junction
            ? entry
            : {
                ...entry,
                selected: entry.selected === 0 ? 1 : 0,
              },
        ),
      }
    : {
        ...run.power,
        receivers: run.power.receivers.map((entry) =>
          entry.index === index ? { ...entry, recorded: true } : entry,
        ),
      }
  // Operation happens at the junction, never remotely from a branch that is about to close.
  const next = routeDoors({ ...run, player: index, steps: run.steps + 1 }, power)

  return next.walls.includes(index) ? run : recordTravel(next, path)
}

/** Readings survive rerouting; power is needed when recording, not when leaving the floor. */
export function powerObjectiveComplete(power: FloorPower): boolean {
  return power.receivers.every((entry) => entry.recorded)
}
