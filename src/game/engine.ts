export type Difficulty = 'easy' | 'medium' | 'expert' | 'custom'
export type Phase = 'ready' | 'playing' | 'won' | 'lost'
export type Visibility = 'hidden' | 'revealed' | 'flagged'
export interface Config { readonly width: number; readonly height: number; readonly mines: number }
export interface Cell { readonly mine: boolean; readonly adjacent: number; readonly visibility: Visibility }
export interface Game {
  readonly config: Config
  readonly seed: number
  readonly firstClick: number | null
  readonly phase: Phase
  readonly cells: readonly Cell[]
  readonly exploded: number | null
}
export type Action = { readonly type: 'reveal' | 'flag' | 'chord'; readonly index: number }

export const PRESETS = {
  easy: { width: 9, height: 9, mines: 10 },
  medium: { width: 16, height: 16, mines: 40 },
  expert: { width: 30, height: 16, mines: 99 },
} as const satisfies Record<Exclude<Difficulty, 'custom'>, Config>

export function validConfig(config: Config): boolean {
  const { width, height, mines } = config
  return [width, height, mines].every(Number.isInteger)
    && width >= 5 && width <= 40 && height >= 5 && height <= 30
    && mines >= 1 && mines <= width * height - 9
}

export function neighbors(config: Config, index: number): number[] {
  const x = index % config.width
  const y = Math.floor(index / config.width)
  const result: number[] = []
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy
      if ((dx || dy) && nx >= 0 && nx < config.width && ny >= 0 && ny < config.height) {
        result.push(ny * config.width + nx)
      }
    }
  }
  return result
}

/** Seeded Mulberry32; rejection sampling avoids modulo bias in shuffle indices. */
function randomIndex(seed: number): (bound: number) => number {
  let state = seed >>> 0
  return bound => {
    const limit = Math.floor(0x100000000 / bound) * bound
    let value: number
    do {
      state = (state + 0x6d2b79f5) >>> 0
      let t = Math.imul(state ^ (state >>> 15), state | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      value = (t ^ (t >>> 14)) >>> 0
    } while (value >= limit)
    return value % bound
  }
}

/** Shuffle eligible positions once, then take exactly M unique positions. O(N). */
export function minePositions(config: Config, firstClick: number, seed: number): Set<number> {
  if (!validConfig(config) || !Number.isInteger(firstClick) || firstClick < 0 || firstClick >= config.width * config.height) {
    throw new RangeError('Invalid board configuration or first click')
  }
  const safe = new Set([firstClick, ...neighbors(config, firstClick)])
  const candidates = Array.from({ length: config.width * config.height }, (_, index) => index)
    .filter(index => !safe.has(index))
  const next = randomIndex(seed)
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = next(i + 1)
    const a = candidates[i], b = candidates[j]
    if (a !== undefined && b !== undefined) { candidates[i] = b; candidates[j] = a }
  }
  return new Set(candidates.slice(0, config.mines))
}

function layout(config: Config, firstClick: number, seed: number): Cell[] {
  const mines = minePositions(config, firstClick, seed)
  return Array.from({ length: config.width * config.height }, (_, index) => ({
    mine: mines.has(index),
    adjacent: neighbors(config, index).filter(neighbor => mines.has(neighbor)).length,
    visibility: 'hidden',
  }))
}

export function createGame(config: Config, seed: number): Game {
  if (!validConfig(config)) throw new RangeError('Invalid board configuration')
  return {
    config: { ...config }, seed: seed >>> 0, firstClick: null, phase: 'ready', exploded: null,
    cells: Array.from({ length: config.width * config.height }, () => ({ mine: false, adjacent: 0, visibility: 'hidden' })),
  }
}

export function stats(game: Game): { flags: number; revealed: number; remaining: number } {
  const flags = game.cells.filter(cell => cell.visibility === 'flagged').length
  const revealed = game.cells.filter(cell => !cell.mine && cell.visibility === 'revealed').length
  return { flags, revealed, remaining: game.cells.length - game.config.mines - revealed }
}

/** Pure game transition. The DOM, clock and storage never enter the game engine. */
export function act(game: Game, action: Action): Game {
  const original = game.cells[action.index]
  if (!Number.isInteger(action.index) || !original || game.phase === 'won' || game.phase === 'lost') return game
  if (action.type === 'flag') {
    if (original.visibility === 'revealed') return game
    return { ...game, cells: game.cells.map((cell, index) => index === action.index
      ? { ...cell, visibility: cell.visibility === 'flagged' ? 'hidden' : 'flagged' } : cell) }
  }
  if (original.visibility === 'flagged') return game
  let next = game
  if (game.phase === 'ready') {
    if (action.type !== 'reveal') return game
    next = {
      ...game, phase: 'playing', firstClick: action.index,
      cells: layout(game.config, action.index, game.seed).map((cell, index) => ({
        ...cell, visibility: game.cells[index]?.visibility ?? 'hidden',
      })),
    }
  }
  const cells = [...next.cells]
  const queue: number[] = []
  if (original.visibility === 'revealed' || action.type === 'chord') {
    if (original.visibility !== 'revealed' || original.adjacent === 0) return game
    const around = neighbors(game.config, action.index)
    if (around.filter(index => cells[index]?.visibility === 'flagged').length !== original.adjacent) return game
    queue.push(...around)
  } else queue.push(action.index)

  // Iterative flood fill: even a large empty region cannot overflow the call stack.
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const index = queue[cursor]
    if (index === undefined) continue
    const cell = cells[index]
    if (!cell || cell.visibility !== 'hidden') continue
    cells[index] = { ...cell, visibility: 'revealed' }
    if (cell.mine) return { ...next, cells, phase: 'lost', exploded: index }
    if (cell.adjacent === 0) queue.push(...neighbors(game.config, index))
  }
  next = { ...next, cells }
  if (stats(next).remaining === 0) {
    return { ...next, phase: 'won', cells: cells.map(cell => cell.mine ? { ...cell, visibility: 'flagged' } : cell) }
  }
  return next
}

export function snapshot(game: Game): object {
  return { config: game.config, seed: game.seed, firstClick: game.firstClick, visible: game.cells.map(cell => cell.visibility) }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Recompute mines and clues from the seed; never trust stored board internals. */
export function restore(value: unknown): Game | null {
  if (!isRecord(value) || !isRecord(value['config'])) return null
  const { width, height, mines } = value['config']
  const seed = value['seed'], first = value['firstClick'], visible: unknown = value['visible']
  if (typeof width !== 'number' || typeof height !== 'number' || typeof mines !== 'number'
    || typeof seed !== 'number' || !Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) return null
  const config = { width, height, mines }
  if (!validConfig(config) || !Array.isArray(visible) || visible.length !== width * height
    || !visible.every(item => item === 'hidden' || item === 'revealed' || item === 'flagged')) return null
  const visibility = visible as Visibility[]
  if (first === null) {
    if (visibility.includes('revealed')) return null
    const game = createGame(config, seed)
    return { ...game, cells: game.cells.map((cell, i) => ({ ...cell, visibility: visibility[i] ?? 'hidden' })) }
  }
  if (typeof first !== 'number' || !Number.isInteger(first) || first < 0 || first >= width * height || visibility[first] !== 'revealed') return null
  const cells = layout(config, first, seed).map((cell, i) => ({ ...cell, visibility: visibility[i] ?? 'hidden' }))
  if (cells.some(cell => cell.mine && cell.visibility === 'revealed')) return null
  const game: Game = { config, seed, firstClick: first, cells, phase: 'playing', exploded: null }
  return stats(game).remaining > 0 ? game : null
}
