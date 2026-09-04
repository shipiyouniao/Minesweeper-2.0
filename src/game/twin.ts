import { act, createGame, neighbors, stats } from './engine.js'
import { placedBoard, shuffled } from './variant-board.js'
import type { Twin, TwinAction } from '../types/variants.js'

const CONFIG = { width: 9, height: 9, mines: 12 }

/** Delay the paired layout until a shared safe opening is chosen on either board. */
export function createTwin(seed: number): Twin {
  return {
    seed: seed >>> 0,
    firstClick: null,
    a: createGame(CONFIG, seed),
    b: createGame(CONFIG, seed),
    moves: 0,
    phase: 'ready',
  }
}

/** Partition one shuffled candidate list: each coordinate contains at most one mine. */
function beginTwin(twin: Twin, index: number): Twin {
  const safe = new Set([index, ...neighbors(CONFIG, index)])
  const candidates = shuffled(
    Array.from({ length: 81 }, (_, value) => value).filter((value) => !safe.has(value)),
    twin.seed,
  )
  const a = placedBoard(CONFIG, new Set(candidates.slice(0, 12)), twin.seed, index)
  const b = placedBoard(CONFIG, new Set(candidates.slice(12, 24)), twin.seed, index)

  return { ...twin, firstClick: index, a, b, phase: 'playing' }
}

/** Resolve a move on one side; a flag is a hypothesis and never auto-reveals its partner. */
export function actTwin(twin: Twin, action: TwinAction): Twin {
  if (
    twin.phase === 'won' ||
    twin.phase === 'lost' ||
    !Number.isInteger(action.index) ||
    action.index < 0 ||
    action.index >= 81
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
