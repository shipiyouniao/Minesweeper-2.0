import { adjacentSteps } from './variant-board.js'
import type { Game } from '../types/game.js'
import type { Expedition } from '../types/variants.js'

/** Find the entrance's full safe component before any terrain or treasure is published. */
export function connectedFloor(game: Game, entrance: number): Set<number> {
  const connected = new Set<number>([entrance])
  const queue = [entrance]

  for (let cursor = 0; cursor < queue.length; cursor++) {
    const index = queue[cursor]
    if (index === undefined) continue
    for (const neighbor of adjacentSteps(game, index)) {
      if (!connected.has(neighbor) && game.cells[neighbor]?.mine === false) {
        connected.add(neighbor)
        queue.push(neighbor)
      }
    }
  }

  return connected
}

/** Breadth-first search uses only revealed walkable cells, never hidden mine knowledge. */
export function walkingPath(run: Expedition, destination: number): number[] | null {
  if (!Number.isInteger(destination) || run.walls.includes(destination)) return null
  const target = run.game.cells[destination]
  if (!target || target.visibility !== 'revealed' || target.mine) return null
  const parent = new Map<number, number>([[run.player, run.player]])
  const queue = [run.player]

  for (let cursor = 0; cursor < queue.length; cursor++) {
    const index = queue[cursor]
    if (index === undefined) continue
    if (index === destination) break

    for (const neighbor of adjacentSteps(run.game, index)) {
      const cell = run.game.cells[neighbor]
      if (
        !parent.has(neighbor) &&
        !run.walls.includes(neighbor) &&
        cell?.visibility === 'revealed' &&
        !cell.mine
      ) {
        parent.set(neighbor, index)
        queue.push(neighbor)
      }
    }
  }

  if (!parent.has(destination)) return null
  const path = [destination]
  let cursor = destination
  while (cursor !== run.player) {
    const previous = parent.get(cursor)
    if (previous === undefined) return null
    path.push(previous)
    cursor = previous
  }

  return path.reverse()
}

/** Plan a direct walk or the shortest approach to a covered frontier cell. */
export function approachPath(run: Expedition, destination: number): number[] | null {
  if (run.phase !== 'exploring' || run.walls.includes(destination)) return null
  const cell = run.game.cells[destination]
  if (!cell || cell.visibility === 'flagged') return null
  if (cell.visibility === 'revealed') return walkingPath(run, destination)
  let best: number[] | null = null

  for (const neighbor of adjacentSteps(run.game, destination)) {
    const path = walkingPath(run, neighbor)
    if (path && (!best || path.length < best.length)) best = path
  }

  return best
}
