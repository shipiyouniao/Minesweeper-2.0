import type { SessionRuntime } from '../src/application/game-session.js'
import type { StorageLike } from '../src/storage.js'

/** In-memory storage shared by repository and session tests. */
export class MemoryStorage implements StorageLike {
  readonly data = new Map<string, string>()

  /** Match browser storage's null result for missing keys. */
  getItem(key: string): string | null {
    return this.data.get(key) ?? null
  }

  /** Retain serialized values so tests exercise the real repository boundary. */
  setItem(key: string, value: string): void {
    this.data.set(key, value)
  }

  /** Remove only the requested key, matching localStorage semantics. */
  removeItem(key: string): void {
    this.data.delete(key)
  }
}

/** Deterministic services let tests advance time and verify result identity without waiting. */
export class FakeRuntime implements SessionRuntime {
  milliseconds = 0
  seed = 31
  ids = 0

  /** Read the test-controlled monotonic clock without losing the instance binding. */
  readonly now = (): number => this.milliseconds

  /** Return the chosen seed so fixtures reproduce the same board. */
  randomSeed(): number {
    return this.seed
  }

  /** Count record creation to detect duplicate win effects. */
  createId(): string {
    this.ids += 1
    return `result-${this.ids}`
  }

  /** Keep wall-clock record dates stable across machines and time zones. */
  date(): string {
    return '2026-09-03T00:00:00.000Z'
  }
}
