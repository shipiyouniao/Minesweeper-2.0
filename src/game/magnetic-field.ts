import { adjacentSteps } from './variant-board.js'
import type { MagneticExpedition, MagneticForecast, MagneticProjection } from '../types/magnetic.js'

/** Alternate two directed pulses and a quiet turn; the next cycle rotates both axes. */
export function magneticForecast(turn: number, exposedUntil: number): MagneticForecast {
  if (turn <= exposedUntil || turn % 3 === 0) return { kind: 'recovery' }
  const rotated = Math.floor((turn - 1) / 3) % 2 === 1
  const pull = turn % 3 === 1

  return {
    kind: 'field',
    axis: pull !== rotated ? 'horizontal' : 'vertical',
    polarity: pull ? 'pull' : 'push',
  }
}

/** Trace at most two geometric steps using public walls, landmarks and knowledge only. */
export function magneticProjection(
  run: MagneticExpedition,
  index = run.player,
): MagneticProjection {
  const { encounter, game } = run
  const anchored =
    (encounter.braced && index === run.player) ||
    encounter.anchors.some((anchor) => anchor.index === index && anchor.calibrated)
  const result: MagneticProjection = {
    path: [index],
    direction: 'none',
    anchored,
    collision: false,
    landing: 'known',
  }
  const forecast = encounter.forecast
  if (forecast.kind !== 'field' || anchored) return result

  const width = game.config.width
  const horizontal = forecast.axis === 'horizontal'
  const coordinate = horizontal ? index % width : Math.floor(index / width)
  const center = horizontal ? encounter.boss % width : Math.floor(encounter.boss / width)
  const toward = Math.sign(center - coordinate)
  const sign = toward * (forecast.polarity === 'pull' ? 1 : -1)
  if (sign === 0) return result

  const direction = horizontal ? (sign < 0 ? 'left' : 'right') : sign < 0 ? 'up' : 'down'
  const path = [index]
  let collision = false
  for (let step = 0; step < 2; step++) {
    const current = path.at(-1)!
    // Attraction stops on the neutral axis instead of crossing it and oscillating.
    const currentCoordinate = horizontal ? current % width : Math.floor(current / width)
    if (forecast.polarity === 'pull' && currentCoordinate === center) break
    const next = current + sign * (horizontal ? 1 : width)
    if (!adjacentSteps(game, current).includes(next) || run.walls.includes(next)) {
      collision = true
      break
    }
    path.push(next)
    if (encounter.anchors.some((anchor) => anchor.index === next && anchor.calibrated)) break
    if (run.confirmedMines.includes(next)) break
  }
  const landing = path.slice(1).some((cell) => run.confirmedMines.includes(cell))
    ? 'mine'
    : path
          .slice(1)
          .some(
            (cell) =>
              game.cells[cell]?.visibility !== 'revealed' && !run.surveyedCells.includes(cell),
          )
      ? 'uncertain'
      : 'known'

  return { path, direction, anchored, collision, landing }
}

/** Find the shortest lure route through already revealed terrain; never read hidden mine bits. */
export function magneticLurePath(run: MagneticExpedition, target: number): number[] | null {
  const start = run.encounter.boss
  if (run.game.cells[target]?.visibility !== 'revealed') return null
  const previous = new Map<number, number | null>([[start, null]])
  const queue = [start]
  for (const index of queue) {
    if (index === target) break
    for (const next of adjacentSteps(run.game, index)) {
      if (
        previous.has(next) ||
        run.walls.includes(next) ||
        run.game.cells[next]?.visibility !== 'revealed'
      )
        continue
      previous.set(next, index)
      queue.push(next)
    }
  }
  if (!previous.has(target)) return null
  const path: number[] = []
  for (let cursor: number | null = target; cursor !== null; cursor = previous.get(cursor) ?? null)
    path.push(cursor)
  path.reverse()

  // A second station creates real repositioning; an adjacent knight cannot build up momentum.
  return path.length >= 3 ? path : null
}
