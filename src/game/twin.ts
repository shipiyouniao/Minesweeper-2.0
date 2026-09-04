import { act, createGame, neighbors, stats } from './engine.js'
import { placedBoard, shuffled } from './variant-board.js'
import { twinConfig } from './variant-difficulty.js'
import type { Twin, TwinAction } from '../types/variants.js'
import type { VariantDifficulty } from '../types/variant-difficulty.js'

/** Delay the paired layout until a shared safe opening is chosen on either board. */
export function createTwin(seed: number, difficulty?: VariantDifficulty): Twin {
  const config = twinConfig(difficulty)

  return {
    seed: seed >>> 0,
    ...(difficulty ? { difficulty } : {}),
    firstClick: null,
    a: createGame(config, seed),
    b: createGame(config, seed),
    moves: 0,
    phase: 'ready',
  }
}

/** Partition one shuffled candidate list: each coordinate contains at most one mine. */
function beginTwin(twin: Twin, index: number): Twin {
  const config = twin.a.config
  const safe = new Set([index, ...neighbors(config, index)])
  const candidates = shuffled(
    Array.from({ length: config.width * config.height }, (_, value) => value).filter(
      (value) => !safe.has(value),
    ),
    twin.seed,
  )
  const a = placedBoard(config, new Set(candidates.slice(0, config.mines)), twin.seed, index)
  const b = placedBoard(
    config,
    new Set(candidates.slice(config.mines, config.mines * 2)),
    twin.seed,
    index,
  )

  return { ...twin, firstClick: index, a, b, phase: 'playing' }
}

/** Resolve a move on one side; a flag is a hypothesis and never auto-reveals its partner. */
export function actTwin(twin: Twin, action: TwinAction): Twin {
  if (
    twin.phase === 'won' ||
    twin.phase === 'lost' ||
    !Number.isInteger(action.index) ||
    action.index < 0 ||
    action.index >= twin.a.cells.length
  )
    return twin
  if (twin.phase === 'ready' && action.type === 'flag') return twin

  const next = twin.phase === 'ready' ? beginTwin(twin, action.index) : twin
  const before = next[action.side]
  const board =
    twin.phase === 'ready' ? before : act(before, { type: action.type, index: action.index })
  if (twin.phase !== 'ready' && board === before) return twin

  const a = action.side === 'a' ? board : next.a
  const b = action.side === 'b' ? board : next.b
  const phase =
    a.phase === 'lost' || b.phase === 'lost'
      ? 'lost'
      : stats(a).remaining === 0 && stats(b).remaining === 0
        ? 'won'
        : 'playing'

  return { ...next, a, b, moves: twin.moves + 1, phase }
}
