import type { MonotonicNow } from '../types/session.js'

/** Owns elapsed time across running, paused, and restored game sessions. */
export class GameClock {
  private readonly now: MonotonicNow
  private accumulated = 0
  private startedAt: number | null = null

  /** Inject the time source so game timing never depends on a browser global. */
  constructor(now: MonotonicNow) {
    this.now = now
  }

  /** Read elapsed time without changing the current running interval. */
  get elapsed(): number {
    return this.accumulated + (this.startedAt === null ? 0 : this.now() - this.startedAt)
  }

  /** Report whether an interval is currently contributing to elapsed time. */
  get running(): boolean {
    return this.startedAt !== null
  }

  /** Start a new interval; repeated resumes must not discard elapsed time. */
  resume(): void {
    if (this.startedAt === null) {
      this.startedAt = this.now()
    }
  }

  /** Fold the active interval into the total before stopping the clock. */
  pause(): void {
    this.accumulated = this.elapsed
    this.startedAt = null
  }

  /** Load a saved duration or reset a new game, always in a stopped state. */
  reset(elapsed = 0): void {
    this.accumulated = elapsed
    this.startedAt = null
  }
}
