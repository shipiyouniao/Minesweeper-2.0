import { occupied } from './dungeon-occupancy.js'
import { adjacentSteps } from './variant-board.js'
import type { Expedition } from '../types/variants.js'

/** Room identity prevents ordinary coordinates or mirrored realms becoming teleport destinations. */
export function skillRoom(run: Expedition): string {
  const encounter = run.encounter
  return `${run.floor}:${encounter?.kind ?? 'floor'}:${encounter?.kind === 'mirror' ? encounter.active : ''}`
}

/** Expose an anchor only inside the floor, encounter and realm where it was placed. */
export function currentWaymark(run: Expedition): number | null {
  return run.waymark?.room === skillRoom(run) ? run.waymark.index : null
}

/** Require an exposed safe destination free of terrain and encounter occupants. */
function clearLanding(run: Expedition, index: number): boolean {
  const cell = run.game.cells[index]
  return Boolean(
    cell &&
    cell.visibility === 'revealed' &&
    !cell.mine &&
    !occupied(run, index) &&
    index !== run.encounter?.boss,
  )
}

/** Only one public obstacle between two revealed safe squares can be bridged. */
export function riftLandings(run: Expedition): number[] {
  const { width, height } = run.game.config
  const row = Math.floor(run.player / width),
    column = run.player % width
  const targets: number[] = []
  for (const [dy, dx] of [
    [-1, 0],
    [0, 1],
    [1, 0],
    [0, -1],
  ] as const) {
    const y = row + dy * 2,
      x = column + dx * 2
    if (x < 0 || y < 0 || x >= width || y >= height) continue
    const wall = (row + dy) * width + column + dx,
      landing = y * width + x
    if (
      (run.walls.includes(wall) || run.confirmedMines.includes(wall)) &&
      wall !== run.encounter?.boss &&
      clearLanding(run, landing)
    )
      targets.push(landing)
  }
  return targets
}

/** Derive whether the current room offers a legal placement, return or rift landing. */
export function mobilityReady(run: Expedition): boolean {
  if (run.departure.profession === 'riftwalker') return riftLandings(run).length > 0
  const mark = currentWaymark(run)
  return mark === null || (mark !== run.player && clearLanding(run, mark))
}

/** Walking uses the same one-edge, bidirectional portal in previews, movement and frontier search. */
export function walkingNeighbors(run: Expedition, index: number): number[] {
  const ordinary = adjacentSteps(run.game, index)
  const rift = run.rift
  if (!rift || rift.room !== skillRoom(run)) return ordinary
  // A tide carries both ends of an established portal. Their arithmetic midpoint no longer
  // identifies the original crossed obstacle, and cannot invalidate the already-paid link.
  if (run.encounter?.kind !== 'tide' && (rift.from + rift.to) / 2 === run.encounter?.boss)
    return ordinary
  return index === rift.from
    ? [...ordinary, rift.to]
    : index === rift.to
      ? [...ordinary, rift.from]
      : ordinary
}

/** The opened corridor lasts for the room, so crossing never seals the return route. */
export function useMobilitySkill(run: Expedition, index?: number): Expedition {
  if (run.departure.profession === 'waymarker') {
    const mark = currentWaymark(run)
    if (mark === null)
      return { ...run, waymark: { index: run.player, room: skillRoom(run) }, steps: run.steps + 1 }
    return { ...run, player: mark, waymark: undefined, skillUsed: true, steps: run.steps + 1 }
  }
  if (index === undefined || !riftLandings(run).includes(index)) return run
  return {
    ...run,
    rift: { from: run.player, to: index, room: skillRoom(run) },
    player: index,
    skillUsed: true,
    steps: run.steps + 1,
  }
}
