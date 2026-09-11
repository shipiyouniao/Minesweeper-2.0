import { neighbors } from './engine.js'
import { adjacentSteps, shuffled } from './variant-board.js'
import { solveBattle } from './battle-arena.js'
import type { TideExpedition } from '../types/tide.js'
import type { Config, Game } from '../types/game.js'

/** The visible anchor footprint includes its center and clipped eight neighbors. */
export function anchorArea(config: Config, index: number): readonly number[] {
  return [index, ...neighbors(config, index)]
}

/** Move complete tile records and every piece of tile-specific knowledge together. */
export function permuteTide(run: TideExpedition, permutation: readonly number[]): TideExpedition {
  /** Carry tile-bound knowledge through the same permutation as the terrain. */
  const map = (indices: readonly number[]): number[] => indices.map((index) => permutation[index]!)
  const cells = [...run.game.cells]
  for (const [from, to] of permutation.entries()) cells[to] = run.game.cells[from]!

  const game: Game = {
    ...run.game,
    cells: cells.map((cell, index) => ({
      ...cell,
      adjacent: neighbors(run.game.config, index).filter((other) => cells[other]!.mine).length,
    })),
    safeMarks: map(run.game.safeMarks),
    firstClick: run.game.firstClick === null ? null : permutation[run.game.firstClick]!,
    exploded: run.game.exploded === null ? null : permutation[run.game.exploded]!,
  }

  return {
    ...run,
    game,
    walls: map(run.walls),
    entrance: permutation[run.entrance]!,
    travelled: map(run.travelled),
    treasures: map(run.treasures),
    collected: map(run.collected),
    confirmedMines: map(run.confirmedMines),
    triggeredMines: map(run.triggeredMines),
    surveyedCells: map(run.surveyedCells),
    waymark: run.waymark ? { ...run.waymark, index: permutation[run.waymark.index]! } : undefined,
    rift: run.rift
      ? { ...run.rift, from: permutation[run.rift.from]!, to: permutation[run.rift.to]! }
      : undefined,
    // Geometric reports describe the previous arrangement; individual discoveries remain valid.
    scannedRows: [],
    probeReport: null,
    sonar: { ...run.sonar, readings: [] },
    encounter: { ...run.encounter, core: permutation[run.encounter.core]!, permutation },
  }
}

/** Verify safe connectivity without treating a player's mistaken flag as terrain. */
function connected(run: TideExpedition, game: Game): boolean {
  const found = new Set([run.player])
  const queue = [run.player]
  for (const index of queue) {
    for (const other of adjacentSteps(game, index)) {
      if (found.has(other) || run.walls.includes(other) || game.cells[other]!.mine) continue

      if (game.cells[other]!.visibility !== 'revealed') continue

      found.add(other)
      queue.push(other)
    }
  }

  return game.cells.every(
    (cell, index) => cell.mine || run.walls.includes(index) || found.has(index),
  )
}

/** Accept only arrangements solvable from current clues, never from guessed ordinary flags. */
function playable(run: TideExpedition): boolean {
  const publicGame: Game = {
    ...run.game,
    cells: run.game.cells.map((cell, index) => ({
      ...cell,
      visibility:
        cell.visibility === 'flagged' && !run.confirmedMines.includes(index)
          ? 'hidden'
          : cell.visibility,
    })),
  }
  return connected(run, solveBattle(publicGame, run.walls, run.player))
}

/** Shuffle outside fixed footprints; failed candidates never mutate the accepted board. */
export function shuffleTide(run: TideExpedition): TideExpedition {
  // The boss shares the movement wall list, but only terrain walls retain their mine borders.
  const wallMines = run.walls
    .filter((index) => index !== run.encounter.boss)
    .flatMap((index) =>
      adjacentSteps(run.game, index).filter((other) => run.game.cells[other]!.mine),
    )
  const fixed = new Set([
    run.player,
    run.encounter.boss,
    ...run.walls,
    ...wallMines,
    ...run.encounter.anchors.flatMap((index) => anchorArea(run.game.config, index)),
  ])
  const indices = run.game.cells.map((_, index) => index)
  const movable = indices.filter((index) => !fixed.has(index))
  for (let attempt = 0; attempt < 128; attempt++) {
    const destinations = shuffled(
      movable,
      (run.game.seed ^
        Math.imul(run.encounter.turn, 0x45d9f3b) ^
        Math.imul(attempt + 1, 0x85ebca6b)) >>>
        0,
    )
    const permutation = [...indices]
    for (const [offset, from] of movable.entries()) permutation[from] = destinations[offset]!

    const candidate = permuteTide(run, permutation)
    if (playable(candidate)) return candidate
  }

  // A fully anchored or unusually constrained board may resist a tide; no unsafe fallback.

  return { ...run, encounter: { ...run.encounter, permutation: indices } }
}
