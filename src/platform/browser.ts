import type { SessionRuntime } from '../types/session.js'
import type { StorageLike } from '../types/storage.js'

/** Defers localStorage access until an operation that Repository can safely catch. */
export class BrowserStorage implements StorageLike {
  /** Read a value; browsers may throw when storage is disabled. */
  getItem(key: string): string | null {
    return localStorage.getItem(key)
  }

  /** Write a value; quota failures propagate to the repository boundary. */
  setItem(key: string, value: string): void {
    localStorage.setItem(key, value)
  }

  /** Remove one value without clearing unrelated application data. */
  removeItem(key: string): void {
    localStorage.removeItem(key)
  }
}

/** Browser implementations of time and randomness, isolated from application rules. */
export const browserRuntime: SessionRuntime = {
  /** Use monotonic time so calendar adjustments cannot affect a game duration. */
  now: () => performance.now(),

  /** Seed deterministic placement with browser-provided randomness for each game. */
  randomSeed(): number {
    const values = new Uint32Array(1)
    crypto.getRandomValues(values)

    return values[0] ?? 0
  },

  /** Give each completed game a stable identity for later nickname changes. */
  createId: () => crypto.randomUUID(),

  /** Store calendar dates in a locale-independent representation. */
  date: () => new Date().toISOString(),
}
