import { neighbors, randomIndex } from './engine.js'
import { adjacentSteps, placedBoard, shuffled } from './variant-board.js'
import { connectedFloor } from './dungeon-path.js'
import type { Config, Game } from '../types/game.js'
import type { DungeonLayout, DungeonOpening } from '../types/dungeon-generation.js'

/** Generate a varied entrance, naturally expanded blank region and distant reachable stairs. */
export function generateDungeon(
  seed: number,
  mines: number,
  mode: DungeonOpening = 'flood',
): DungeonLayout {
  const config: Config = { width: 9, height: 9, mines }
  const next = randomIndex(seed ^ 0x37a1)
  const entrance = (1 + next(7)) * 9 + 1 + next(7)
  const indices = Array.from({ length: 81 }, (_, index) => index)
  const safe = new Set([entrance, ...neighbors(config, entrance)])
  const diagonal = next(2) === 0 ? [-10, 10] : [-8, 8]
  const opening = new Set([
    entrance,
    entrance - 9,
    entrance + 9,
    entrance - 1,
    entrance + 1,
    ...diagonal.map((offset) => entrance + offset),
  ])
  const eligible = indices.filter((index) => !safe.has(index))

  for (let attempt = 0; attempt < 128; attempt++) {
    const selected = new Set(
      shuffled(eligible, seed + Math.imul(attempt + 1, 0x45d9f3b)).slice(0, mines),
    )
    const game = openingBoard(config, selected, seed, entrance, opening, mode)
    const floor = connectedFloor(game, entrance)
    const walls = new Set(indices.filter((index) => !selected.has(index) && !floor.has(index)))
    const accessible = [...selected].every((index) =>
      adjacentSteps(game, index).some((neighbor) => floor.has(neighbor)),
    )

    // Retain useful boundary clues without artificially cutting off a connected blank region.
    if (
      accessible &&
      game.cells.filter(
        (cell, index) => cell.visibility === 'revealed' && cell.adjacent > 0 && !walls.has(index),
      ).length >= 2 &&
      openingHasMineDeduction(game, walls)
    ) {
      const layout = finishLayout(game, entrance, walls, seed)
      if (layout) return layout
    }
  }

  return fallbackLayout(config, seed, entrance, opening, safe, mode)
}

/** Use standard flood fill, retaining the historical seven-cell opening only for old journals. */
function openingBoard(
  config: Config,
  mines: ReadonlySet<number>,
  seed: number,
  entrance: number,
  opening: ReadonlySet<number>,
  mode: DungeonOpening,
): Game {
  const game = placedBoard(config, mines, seed, entrance)
  if (mode === 'flood') return { ...game, phase: 'playing' }
  return {
    ...game,
    phase: 'playing',
    cells: game.cells.map((cell, index) => ({
      ...cell,
      visibility: opening.has(index) ? 'revealed' : 'hidden',
    })),
  }
}

/** Validate an opening using only public clues and elementary safe/mine deductions. */
function openingHasMineDeduction(game: Game, walls: ReadonlySet<number>): boolean {
  const known = new Set(
    game.cells.flatMap((cell, index) =>
      cell.visibility === 'revealed' && !walls.has(index) ? [index] : [],
    ),
  )
  for (let step = 0; step < game.cells.length; step++) {
    let changed = false
    for (const index of known) {
      const count = game.cells[index]?.adjacent ?? 0
      const hidden = neighbors(game.config, index).filter(
        (other) => !known.has(other) && !walls.has(other),
      )
      if (count > 0 && count === hidden.length) return true
      if (count !== 0) continue

      for (const other of hidden) {
        if (adjacentSteps(game, other).some((near) => known.has(near))) {
          known.add(other)
          changed = true
        }
      }
    }
    if (!changed) return false
  }
  return false
}

/** Choose distant stairs by actual floor distance, with seeded variation among far candidates. */
function finishLayout(
  game: Game,
  entrance: number,
  walls: ReadonlySet<number>,
  seed: number,
): DungeonLayout | null {
  const distance = new Map([[entrance, 0]])
  const queue = [entrance]
  for (const index of queue) {
    for (const next of adjacentSteps(game, index)) {
      if (distance.has(next) || walls.has(next) || game.cells[next]?.mine) continue
      distance.set(next, (distance.get(index) ?? 0) + 1)
      queue.push(next)
    }
  }
  const furthest = Math.max(...distance.values())
  const candidates = [...distance.keys()].filter(
    (index) => (distance.get(index) ?? 0) >= Math.max(6, furthest - 2),
  )
  const exit = shuffled(candidates, seed ^ 0xe817)[0]
  // A small enclosed component can satisfy clue checks but still leave no room for a journey.
  if (exit === undefined) return null
  const treasures = shuffled(
    [...distance.keys()].filter(
      (index) => index !== entrance && index !== exit && (distance.get(index) ?? 0) >= 3,
    ),
    seed ^ 0xa710,
  ).slice(0, 3)
  const terrain: Game = {
    ...game,
    cells: game.cells.map((cell, index) =>
      walls.has(index) ? { ...cell, visibility: 'hidden' } : cell,
    ),
  }
  return { game: terrain, entrance, exit, walls: [...walls], treasures }
}

/** Bound generation with connected striped terrain and an opening clue that proves three mines. */
function fallbackLayout(
  config: Config,
  seed: number,
  entrance: number,
  opening: ReadonlySet<number>,
  safe: ReadonlySet<number>,
  mode: DungeonOpening,
): DungeonLayout {
  const x = entrance % 9
  const y = Math.floor(entrance / 9)
  const mineRow = y <= 4 ? y + 2 : y - 2
  const guaranteed = [mineRow * 9 + x - 1, mineRow * 9 + x, mineRow * 9 + x + 1]
  const spine = x <= 4 ? 8 : 0
  const eligible = Array.from({ length: 81 }, (_, index) => index).filter(
    (index) =>
      Math.floor(index / 9) % 2 === y % 2 &&
      index % 9 !== spine &&
      !safe.has(index) &&
      !guaranteed.includes(index),
  )
  const selected = new Set([
    ...guaranteed,
    ...shuffled(eligible, seed ^ 0xc011).slice(0, config.mines - 3),
  ])
  const game = openingBoard(config, selected, seed, entrance, opening, mode)

  // The clear spine joins all safe rows. After the center's two safe corners,
  // the facing clue has exactly three unknown neighbors, all guaranteed mines.
  const layout = finishLayout(game, entrance, new Set(), seed)
  if (!layout) throw new Error('Connected fallback must have distant reachable stairs')
  return layout
}
