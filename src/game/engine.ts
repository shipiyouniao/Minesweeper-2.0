/** Preset names are also the persistence keys; custom boards remain unranked. */
export type Difficulty = 'easy' | 'medium' | 'expert' | 'custom'
export type Phase = 'ready' | 'playing' | 'won' | 'lost'
export type Visibility = 'hidden' | 'revealed' | 'flagged'

/** Immutable dimensions and the exact number of mines to place. */
export interface Config {
  readonly width: number
  readonly height: number
  readonly mines: number
}

/** Logical cell data; covered clues are never sent to the rendered DOM. */
export interface Cell {
  readonly mine: boolean
  readonly adjacent: number
  readonly visibility: Visibility
}

/** A complete value representing one point in a game's history. */
export interface Game {
  readonly config: Config
  readonly seed: number
  readonly firstClick: number | null
  readonly phase: Phase
  readonly cells: readonly Cell[]
  readonly exploded: number | null
}

/** Player intent contains no browser event, clock, or storage dependency. */
export interface Action {
  readonly type: 'reveal' | 'flag' | 'chord'
  readonly index: number
}

/** Only the seed, opening move, and player-visible state need to be persisted. */
export interface GameSnapshot {
  readonly config: Config
  readonly seed: number
  readonly firstClick: number | null
  readonly visible: readonly Visibility[]
}

export const PRESETS = {
  easy: { width: 9, height: 9, mines: 10 },
  medium: { width: 16, height: 16, mines: 40 },
  expert: { width: 30, height: 16, mines: 99 },
} as const satisfies Record<Exclude<Difficulty, 'custom'>, Config>

/** Validate dimensions while reserving room for a safe 3 × 3 opening anywhere. */
export function validConfig(config: Config): boolean {
  const { width, height, mines } = config

  return (
    [width, height, mines].every(Number.isInteger) &&
    width >= 5 &&
    width <= 40 &&
    height >= 5 &&
    height <= 30 &&
    mines >= 1 &&
    mines <= width * height - 9
  )
}

/** Return neighboring indices in row order, excluding the center and off-board cells. */
export function neighbors(config: Config, index: number): number[] {
  const x = index % config.width
  const y = Math.floor(index / config.width)
  const result: number[] = []

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx
      const ny = y + dy
      const inside = nx >= 0 && nx < config.width && ny >= 0 && ny < config.height

      if ((dx !== 0 || dy !== 0) && inside) {
        result.push(ny * config.width + nx)
      }
    }
  }

  return result
}

/**
 * Create a seeded Mulberry32 stream with unbiased bounded indices.
 * Mutable PRNG state stays inside this call; identical seeds reproduce the stream.
 */
function randomIndex(seed: number): (bound: number) => number {
  let state = seed >>> 0

  /** Reject the incomplete upper bucket before reducing a 32-bit value modulo bound. */
  return function nextIndex(bound: number): number {
    const limit = Math.floor(0x100000000 / bound) * bound
    let value: number

    do {
      state = (state + 0x6d2b79f5) >>> 0
      let mixed = Math.imul(state ^ (state >>> 15), state | 1)
      mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61)
      value = (mixed ^ (mixed >>> 14)) >>> 0
    } while (value >= limit)

    return value % bound
  }
}

/** Shuffle eligible positions once, then select exactly M distinct mines in O(N). */
export function minePositions(config: Config, firstClick: number, seed: number): Set<number> {
  if (
    !validConfig(config) ||
    !Number.isInteger(firstClick) ||
    firstClick < 0 ||
    firstClick >= config.width * config.height
  ) {
    throw new RangeError('Invalid board configuration or first click')
  }

  // Excluding the neighborhood before shuffling guarantees the safe opening
  // without retrying layouts or moving mines after clues have been calculated.
  const safe = new Set([firstClick, ...neighbors(config, firstClick)])
  const candidates = Array.from(
    { length: config.width * config.height },
    (_, index) => index,
  ).filter((index) => !safe.has(index))
  const next = randomIndex(seed)

  for (let index = candidates.length - 1; index > 0; index--) {
    const other = next(index + 1)
    const left = candidates[index]
    const right = candidates[other]

    if (left !== undefined && right !== undefined) {
      candidates[index] = right
      candidates[other] = left
    }
  }

  return new Set(candidates.slice(0, config.mines))
}

/** Derive every clue from the complete mine set; placement order cannot affect clues. */
function layout(config: Config, firstClick: number, seed: number): Cell[] {
  const mines = minePositions(config, firstClick, seed)

  return Array.from({ length: config.width * config.height }, (_, index) => ({
    mine: mines.has(index),
    adjacent: neighbors(config, index).filter((neighbor) => mines.has(neighbor)).length,
    visibility: 'hidden',
  }))
}

/** Create a covered, ungenerated board; the first reveal determines the safe opening. */
export function createGame(config: Config, seed: number): Game {
  if (!validConfig(config)) {
    throw new RangeError('Invalid board configuration')
  }

  return {
    config: { ...config },
    seed: seed >>> 0,
    firstClick: null,
    phase: 'ready',
    exploded: null,
    cells: Array.from({ length: config.width * config.height }, () => ({
      mine: false,
      adjacent: 0,
      visibility: 'hidden',
    })),
  }
}

/** Derive counters instead of storing totals that could drift apart during a move. */
export function stats(game: Game): { flags: number; revealed: number; remaining: number } {
  const flags = game.cells.filter((cell) => cell.visibility === 'flagged').length
  const revealed = game.cells.filter((cell) => !cell.mine && cell.visibility === 'revealed').length

  return { flags, revealed, remaining: game.cells.length - game.config.mines - revealed }
}

/** Toggle one covered cell while sharing every unchanged immutable cell value. */
function toggleFlag(game: Game, index: number): Game {
  return {
    ...game,
    cells: game.cells.map((cell, cellIndex) =>
      cellIndex === index
        ? { ...cell, visibility: cell.visibility === 'flagged' ? 'hidden' : 'flagged' }
        : cell,
    ),
  }
}

/** Generate the board on demand while preserving flags placed before the first reveal. */
function beginGame(game: Game, index: number): Game {
  return {
    ...game,
    phase: 'playing',
    firstClick: index,
    cells: layout(game.config, index, game.seed).map((cell, cellIndex) => ({
      ...cell,
      visibility: game.cells[cellIndex]?.visibility ?? 'hidden',
    })),
  }
}

/** Resolve a reveal/chord into starting cells, or reject a mismatched flag count. */
function revealTargets(game: Game, action: Action, original: Cell): number[] | null {
  if (original.visibility !== 'revealed' && action.type !== 'chord') {
    return [action.index]
  }

  if (original.visibility !== 'revealed' || original.adjacent === 0) {
    return null
  }

  const around = neighbors(game.config, action.index)
  const flags = around.filter((index) => game.cells[index]?.visibility === 'flagged').length

  // Matching counts allow the move; correctness is intentionally not assumed.
  // A player can still lose by chording beside incorrectly placed flags.
  return flags === original.adjacent ? around : null
}

/** Reveal targets and blank regions iteratively, stopping immediately at a mine. */
function revealRegion(game: Game, targets: readonly number[]): Game {
  const cells = [...game.cells]
  const queue = [...targets]

  // A cursor avoids both recursive stack growth and Array.shift's repeated copies.
  // Cells are marked as they are visited, making duplicate queue entries harmless.
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const index = queue[cursor]

    if (index === undefined) {
      continue
    }

    const cell = cells[index]

    if (!cell || cell.visibility !== 'hidden') {
      continue
    }

    cells[index] = { ...cell, visibility: 'revealed' }

    if (cell.mine) {
      return { ...game, cells, phase: 'lost', exploded: index }
    }

    if (cell.adjacent === 0) {
      queue.push(...neighbors(game.config, index))
    }
  }

  return { ...game, cells }
}

/** Complete a safe board without requiring the player to flag every remaining mine. */
function finishIfWon(game: Game): Game {
  if (game.phase === 'lost' || stats(game).remaining !== 0) {
    return game
  }

  return {
    ...game,
    phase: 'won',
    cells: game.cells.map((cell) => (cell.mine ? { ...cell, visibility: 'flagged' } : cell)),
  }
}

/**
 * Pure game transition: return a new state, or the original reference for rejected input.
 * DOM events, wall clocks, randomness sources, and persistence stay outside this engine.
 */
export function act(game: Game, action: Action): Game {
  const original = game.cells[action.index]

  if (
    !Number.isInteger(action.index) ||
    !original ||
    game.phase === 'won' ||
    game.phase === 'lost'
  ) {
    return game
  }

  if (action.type === 'flag') {
    return original.visibility === 'revealed' ? game : toggleFlag(game, action.index)
  }

  if (original.visibility === 'flagged' || (game.phase === 'ready' && action.type !== 'reveal')) {
    return game
  }

  const next = game.phase === 'ready' ? beginGame(game, action.index) : game
  const targets = revealTargets(next, action, original)

  return targets === null ? game : finishIfWon(revealRegion(next, targets))
}

/** Produce a minimal serializable snapshot; mines and clues are regenerated on restore. */
export function snapshot(game: Game): GameSnapshot {
  return {
    config: game.config,
    seed: game.seed,
    firstClick: game.firstClick,
    visible: game.cells.map((cell) => cell.visibility),
  }
}

/** Narrow unknown JSON to a property bag without accepting arrays or null. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Validate a snapshot's primitive fields before attempting deterministic reconstruction. */
function isSnapshot(value: unknown): value is GameSnapshot {
  if (!isRecord(value) || !isRecord(value['config'])) {
    return false
  }

  const { width, height, mines } = value['config']
  const seed = value['seed']
  const first = value['firstClick']
  const visible: unknown = value['visible']

  if (
    typeof width !== 'number' ||
    typeof height !== 'number' ||
    typeof mines !== 'number' ||
    typeof seed !== 'number' ||
    !Number.isInteger(seed) ||
    seed < 0 ||
    seed > 0xffffffff
  ) {
    return false
  }

  return (
    validConfig({ width, height, mines }) &&
    (first === null ||
      (typeof first === 'number' &&
        Number.isInteger(first) &&
        first >= 0 &&
        first < width * height)) &&
    Array.isArray(visible) &&
    visible.length === width * height &&
    visible.every((item) => item === 'hidden' || item === 'revealed' || item === 'flagged')
  )
}

/** Recompute mines and clues from validated input; reject completed or inconsistent saves. */
export function restore(value: unknown): Game | null {
  if (!isSnapshot(value)) {
    return null
  }

  const { config, seed, firstClick, visible } = value

  if (firstClick === null) {
    if (visible.includes('revealed')) {
      return null
    }

    const game = createGame(config, seed)

    return {
      ...game,
      cells: game.cells.map((cell, index) => ({ ...cell, visibility: visible[index] ?? 'hidden' })),
    }
  }

  if (visible[firstClick] !== 'revealed') {
    return null
  }

  const cells = layout(config, firstClick, seed).map((cell, index) => ({
    ...cell,
    visibility: visible[index] ?? 'hidden',
  }))

  // A saved in-progress game can never contain a revealed mine or a finished board.
  if (cells.some((cell) => cell.mine && cell.visibility === 'revealed')) {
    return null
  }

  const game: Game = {
    config: { ...config },
    seed,
    firstClick,
    cells,
    phase: 'playing',
    exploded: null,
  }

  return stats(game).remaining > 0 ? game : null
}
