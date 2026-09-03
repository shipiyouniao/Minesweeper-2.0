import { isRecord, PRESETS, restore, snapshot, type Difficulty, type Game } from './game/engine.js'

export interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }
export interface Score { id: string; name: string; milliseconds: number; date: string }
export interface Session { game: Game; elapsed: number }
const prefix = 'minesweeper.v3.'

export function difficultyOf(value: unknown): Difficulty {
  if (value === 'medium' || value === 'hard') return 'medium'
  if (value === 'expert' || value === 'extra') return 'expert'
  if (value === 'custom') return 'custom'
  return 'easy'
}

export class Repository {
  available = true
  private readonly storage: StorageLike
  constructor(storage: StorageLike) { this.storage = storage }

  private read(key: string): unknown {
    try {
      const raw = this.storage.getItem(prefix + key)
      return raw && raw.length < 500_000 ? JSON.parse(raw) as unknown : null
    } catch { this.available = false; return null }
  }

  private write(key: string, value: unknown): void {
    try {
      if (value === null) this.storage.removeItem(prefix + key)
      else this.storage.setItem(prefix + key, JSON.stringify(value))
    } catch { this.available = false }
  }

  preference(key: string): unknown { return this.read('preference.' + key) }
  setPreference(key: string, value: string): void { this.write('preference.' + key, value) }

  load(mode: Difficulty): Session | null {
    const saved = this.read('game.' + mode)
    if (!isRecord(saved) || saved['version'] !== 1 || typeof saved['elapsed'] !== 'number'
      || !Number.isFinite(saved['elapsed']) || saved['elapsed'] < 0) return null
    const game = restore(saved['game'])
    if (!game) return null
    if (mode !== 'custom') {
      const preset = PRESETS[mode]
      if (game.config.width !== preset.width || game.config.height !== preset.height || game.config.mines !== preset.mines) return null
    }
    return { game, elapsed: game.phase === 'ready' ? 0 : saved['elapsed'] }
  }

  save(mode: Difficulty, game: Game, elapsed: number): void {
    this.write('game.' + mode, game.phase === 'won' || game.phase === 'lost' ? null : { version: 1, game: snapshot(game), elapsed })
  }

  scores(mode: Difficulty): Score[] {
    const raw = this.read('scores.' + mode)
    if (!Array.isArray(raw)) return []
    return raw.filter((item: unknown): item is Score => isRecord(item)
      && typeof item['id'] === 'string' && typeof item['name'] === 'string' && item['name'].length <= 32
      && typeof item['milliseconds'] === 'number' && Number.isFinite(item['milliseconds']) && item['milliseconds'] >= 0
      && typeof item['date'] === 'string' && Number.isFinite(Date.parse(item['date'])))
      .sort((a, b) => a.milliseconds - b.milliseconds).slice(0, 10)
  }

  record(mode: Difficulty, score: Score): void {
    const scores = this.scores(mode).filter(item => item.id !== score.id)
    scores.push({ ...score, name: score.name.trim().slice(0, 32) || 'Player' })
    this.write('scores.' + mode, scores.sort((a, b) => a.milliseconds - b.milliseconds).slice(0, 10))
  }

  /** Preserve the original edition's local leaderboard when it exists on this origin. */
  migrateLegacy(): void {
    try {
      const text = this.storage.getItem('MinesweeperRank')
      if (!text || text.length > 100_000) return
      const old: unknown = JSON.parse(text)
      if (!isRecord(old)) return
      const mapping = { easy: 'easyRank', medium: 'hardRank', expert: 'extraRank' } as const
      for (const mode of ['easy', 'medium', 'expert'] as const) {
        if (this.read('scores.' + mode) !== null) continue
        const list: unknown = old[mapping[mode]]
        if (!Array.isArray(list)) continue
        for (const [index, item] of list.slice(0, 10).entries()) {
          if (!isRecord(item) || typeof item['time'] !== 'string' || typeof item['ID'] !== 'string') continue
          const match = /^(\d{1,5})h(\d{1,2})min(\d{1,2})s$/.exec(item['time'])
          if (!match) continue
          const milliseconds = (Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3])) * 1000
          this.record(mode, { id: `legacy-${index}`, name: item['ID'], milliseconds, date: new Date(0).toISOString() })
        }
      }
    } catch { /* Old or malformed saves never prevent a new game. */ }
  }
}
