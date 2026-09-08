import { neighbors } from './engine.js'
import { adjacentSteps, placedBoard, shuffled } from './variant-board.js'
import { solveBattle } from './battle-arena.js'
import { deduceSurvey, surveyRuns } from './survey-logic.js'
import type { Config, Game } from '../types/game.js'
import type { MatrixLayout, MatrixRegion } from '../types/matrix.js'

/** Enumerate tiny, line-solvable patterns once; rotations retain their own seed weight. */
function crystalPatterns(): readonly MatrixRegion[] {
  const patterns: MatrixRegion[] = []
  const indices = Array.from({ length: 9 }, (_, index) => index)
  for (let mask = 0; mask < 512; mask++) {
    const crystals = indices.filter((index) => mask & (1 << index))
    if (crystals.length !== 3 && crystals.length !== 4) continue
    const rows = [0, 1, 2].map((row) =>
      surveyRuns([0, 1, 2].map((col) => crystals.includes(row * 3 + col))),
    )
    const columns = [0, 1, 2].map((col) =>
      surveyRuns([0, 1, 2].map((row) => crystals.includes(row * 3 + col))),
    )
    const solved = deduceSurvey(
      { width: 3, height: 3, mines: crystals.length },
      rows,
      columns,
      indices.map(() => 'unresolved'),
    )
    if (!solved.contradiction && !solved.cells.includes('unresolved'))
      patterns.push({ indices, crystals, rows, columns })
  }
  return patterns
}

const patterns = crystalPatterns()

/** Orthogonal distances account for the boss and rocks before terrain is published. */
function distances(game: Game, start: number, blocked: ReadonlySet<number>): Map<number, number> {
  const found = new Map([[start, 0]])
  const queue = [start]
  for (const index of queue)
    for (const next of adjacentSteps(game, index)) {
      if (found.has(next) || blocked.has(next) || game.cells[next]!.mine) continue
      found.set(next, found.get(index)! + 1)
      queue.push(next)
    }
  return found
}

/** Fit independent crystal runs onto terrain reachable through ordinary public deduction. */
function observationRegion(
  game: Game,
  solved: Game,
  walls: readonly number[],
  origin: number,
  seed: number,
): MatrixRegion | null {
  const indices = Array.from(
    { length: 9 },
    (_, local) => origin + Math.floor(local / 3) * game.config.width + (local % 3),
  )
  const pattern = shuffled(patterns, seed).find((entry) =>
    entry.crystals.every((local) => {
      const index = indices[local]!
      return (
        !walls.includes(index) &&
        !game.cells[index]!.mine &&
        solved.cells[index]!.visibility === 'revealed'
      )
    }),
  )
  if (!pattern) return null
  return { ...pattern, indices, crystals: pattern.crystals.map((local) => indices[local]!) }
}

/** Shuffle an exact quota; require connected terrain and short, deducible objective approaches. */
function candidate(config: Config, seed: number): MatrixLayout | null {
  const indices = Array.from({ length: config.width * config.height }, (_, index) => index)
  const interior = indices.filter(
    (index) =>
      index % config.width > 0 &&
      index % config.width < config.width - 1 &&
      Math.floor(index / config.width) > 0 &&
      Math.floor(index / config.width) < config.height - 1,
  )
  const entrance = shuffled(interior, seed)[0]!
  const opening = new Set([entrance, ...neighbors(config, entrance)])
  const mines = new Set(
    shuffled(
      indices.filter((index) => !opening.has(index)),
      seed ^ 0x26d91,
    ).slice(0, config.mines),
  )
  const placed = placedBoard(config, mines, seed, entrance)
  const initial = distances(placed, entrance, new Set())
  const boss = shuffled(
    interior.filter((index) => {
      const distance = initial.get(index) ?? Infinity
      return (
        distance >= 5 &&
        distance <= 8 &&
        adjacentSteps(placed, index).filter((other) => !mines.has(other)).length >= 3
      )
    }),
    seed ^ 0xb055,
  )[0]
  if (boss === undefined) return null
  const obstacles = new Set([boss])
  // Safe rocks vary paths; disconnected islands become explicit walls rather than unreachable floor.
  for (const index of shuffled(
    indices.filter(
      (index) =>
        !opening.has(index) &&
        !mines.has(index) &&
        index !== boss &&
        !adjacentSteps(placed, boss).includes(index),
    ),
    seed ^ 0x70c,
  ).slice(0, 3))
    obstacles.add(index)
  const reached = distances(placed, entrance, obstacles)
  const walls = indices.filter(
    (index) => obstacles.has(index) || (!mines.has(index) && !reached.has(index)),
  )
  const game: Game = {
    ...placed,
    phase: 'playing',
    cells: placed.cells.map((cell, index) =>
      walls.includes(index) ? { ...cell, visibility: 'hidden' } : cell,
    ),
  }
  if (game.cells.filter((cell) => cell.visibility === 'revealed').length > indices.length * 0.5)
    return null
  const solved = solveBattle(game, walls, entrance)
  const approaches = adjacentSteps(game, boss).filter(
    (index) => !walls.includes(index) && solved.cells[index]!.visibility === 'revealed',
  )
  if (approaches.length < 2) return null
  const fromBoss = distances(game, approaches[0]!, new Set(walls))
  const origins = shuffled(
    indices.filter(
      (index) =>
        index % config.width <= config.width - 3 &&
        Math.floor(index / config.width) <= config.height - 3,
    ),
    seed ^ 0x0b5e,
  )
  const regions: MatrixRegion[] = []
  for (const origin of origins) {
    const region = observationRegion(game, solved, walls, origin, seed ^ origin)
    if (
      !region ||
      regions.some((other) => other.indices.some((index) => region.indices.includes(index)))
    )
      continue
    // Every crystal is deducibly reachable; at least two choices are near the boss.
    if (
      region.crystals.filter(
        (index) => (fromBoss.get(index) ?? Infinity) <= 4 && (reached.get(index) ?? Infinity) <= 9,
      ).length < 2
    )
      continue
    if (!region.crystals.some((index) => game.cells[index]!.visibility === 'hidden')) continue
    regions.push(region)
    if (regions.length === 2)
      return { game, walls, entrance, boss, regions: [regions[0]!, regions[1]!] }
  }
  return null
}

/** Bounded retries preserve replay; fallback also passes every validation. */
export function generateMatrix(config: Config, seed: number): MatrixLayout {
  for (let attempt = 0; attempt < 512; attempt++) {
    const base = attempt < 384 ? seed : 0x6a71
    const layout = candidate(config, (base + Math.imul(attempt % 384, 0x45d9f3b)) >>> 0)
    if (layout) return layout
  }
  throw new Error('No verified crystal arena for the supported tier')
}
