import { walkingPath } from './dungeon-path.js'
import { recordTravel } from './exploration-relics.js'
import type { FloorRail, RailMotion } from '../types/floor-rail.js'
import type { Expedition } from '../types/variants.js'

/** Controls are visible landmarks; neither their identity nor availability reveals hidden mines. */
export function railControl(run: Expedition, index: number): boolean {
  return (
    !!run.rail &&
    (index === run.rail.drive ||
      index === run.rail.reverse ||
      run.rail.turnouts.some((turnout) => turnout.index === index))
  )
}

/** Continue along the selected branch, or return to the stem without trapping a cart. */
function nextTrack(rail: FloorRail, index: number, previous: number | null): number | null {
  const turnout = rail.turnouts.find((entry) => entry.index === index)
  if (turnout)
    return previous === turnout.stem || previous === null
      ? turnout.branches[turnout.selected]
      : turnout.stem

  return (
    rail.tracks
      .find((entry) => entry.index === index)
      ?.neighbors.find((next) => next !== previous) ?? null
  )
}

/** Stop before covered/flagged terrain; a forecast and a real trip use exactly the same public rule. */
export function railMotion(run: Expedition, reverse = false): RailMotion {
  const rail = run.rail
  if (!rail) return { path: [], previous: null, stop: 'buffer' }

  const path = [rail.cart]
  let previous = rail.previous
  let index = rail.cart
  let next = reverse ? previous : nextTrack(rail, index, previous)
  while (next !== null && !path.includes(next)) {
    const cell = run.game.cells[next]
    if (!cell || cell.visibility !== 'revealed')
      return { path, previous, stop: cell?.visibility === 'flagged' ? 'blocked' : 'covered' }

    if (run.walls.includes(next) || cell.mine) return { path, previous, stop: 'blocked' }

    path.push(next)
    previous = index
    index = next
    if (rail.turnouts.some((entry) => entry.index === index))
      return { path, previous, stop: 'turnout' }

    if (rail.stations.some((entry) => entry.index === index))
      return { path, previous, stop: 'station' }

    next = nextTrack(rail, index, previous)
  }

  return { path, previous, stop: 'buffer' }
}

/** A cart presses a brake latch permanently, so a later reversal cannot strand the player. */
function arrive(run: Expedition, rail: FloorRail): Expedition {
  const stations = rail.stations.map((station) =>
    station.index === rail.cart &&
    (station.requires === null ||
      rail.stations.some((entry) => entry.index === station.requires && entry.visited))
      ? { ...station, visited: true }
      : station,
  )
  const opened = rail.doors.filter((door) =>
    stations.some((station) => station.index === door.station && station.visited),
  )

  return {
    ...run,
    rail: { ...rail, stations },
    walls: run.walls.filter((index) => !opened.some((door) => door.index === index)),
    game: {
      ...run.game,
      cells: run.game.cells.map((cell, index) =>
        opened.some((door) => door.index === index) ? { ...cell, visibility: 'revealed' } : cell,
      ),
    },
  }
}

/** Physically reach a lever before switching or winching. Rejected trips consume nothing. */
export function interactRail(run: Expedition, index: number): Expedition {
  const rail = run.rail
  if (!rail || !railControl(run, index) || run.game.cells[index]?.visibility !== 'revealed')
    return run

  const walking = walkingPath(run, index)
  if (!walking) return run

  const turnout = rail.turnouts.find((entry) => entry.index === index)
  let updated: FloorRail
  if (turnout) {
    updated = {
      ...rail,
      travel: [],
      turnouts: rail.turnouts.map((entry) =>
        entry === turnout ? { ...entry, selected: entry.selected === 0 ? 1 : 0 } : entry,
      ),
    }
  } else {
    const motion = railMotion(run, index === rail.reverse)
    if (motion.path.length < 2) return run

    updated = {
      ...rail,
      cart: motion.path[motion.path.length - 1]!,
      previous: motion.previous,
      travel: motion.path,
    }
  }

  return recordTravel(arrive({ ...run, player: index, steps: run.steps + 1 }, updated), walking)
}

/** Loading the passenger is not enough: the home station must also have accepted the return. */
export function railObjectiveComplete(rail: FloorRail): boolean {
  return rail.stations.every((station) => station.visited)
}
