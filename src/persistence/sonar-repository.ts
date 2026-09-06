import { PRESETS } from '../game/engine.js'
import { SONAR_ACTION_LIMIT, SONAR_CHARGES } from '../game/sonar.js'
import { RANKED_DIFFICULTIES } from '../game/difficulty.js'
import type { RankedDifficulty } from '../types/game.js'
import type { JsonValue } from '../types/json.js'
import type { SonarAction, SonarRecord, SonarSave } from '../types/sonar.js'
import type { StorageLike } from '../types/storage.js'
import { JsonObjectReader, parseJson } from './json-reader.js'

export const SONAR_STORAGE_KEY = 'minesweeper.sonar.v1'

/** Parse only the three supported Sonar presets, without classic URL aliases. */
export function sonarDifficulty(value: string | null): RankedDifficulty | null {
  return value === 'easy' || value === 'medium' || value === 'expert' ? value : null
}

/** Check bounded integer fields before constructing a journal action or result. */
function integer(value: number | null, low: number, high: number): value is number {
  return value !== null && Number.isInteger(value) && value >= low && value <= high
}

/** Preserve valid wins even when an unrelated active journal needs to be discarded. */
function decodeRecords(values: readonly JsonValue[] | null): readonly SonarRecord[] {
  if (!values || values.length > 30) return []
  const records: SonarRecord[] = []
  for (const value of values) {
    const reader = JsonObjectReader.from(value)
    if (!reader) continue
    const id = reader.string('id')
    const date = reader.string('date')
    const difficulty = sonarDifficulty(reader.string('difficulty'))
    const moves = reader.number('moves')
    const scans = reader.number('scans')
    if (
      !id ||
      id.length > 100 ||
      !date ||
      !Number.isFinite(Date.parse(date)) ||
      !difficulty ||
      !integer(moves, 1, SONAR_ACTION_LIMIT) ||
      !integer(scans, 0, SONAR_CHARGES) ||
      records.some((record) => record.id === id)
    )
      continue
    records.push({ id, date, difficulty, moves, scans })
  }
  return rankSonarRecords(records)
}

/** Retain ten best wins per preset, using scan economy only to break equal move counts. */
export function rankSonarRecords(records: readonly SonarRecord[]): readonly SonarRecord[] {
  return RANKED_DIFFICULTIES.flatMap((difficulty) =>
    records
      .filter((record) => record.difficulty === difficulty)
      .sort(
        (left, right) =>
          left.moves - right.moves ||
          left.scans - right.scans ||
          left.date.localeCompare(right.date),
      )
      .slice(0, 10),
  )
}

/** Shape-check one finite command; replay subsequently verifies that it could be accepted. */
function decodeAction(value: JsonValue, size: number): SonarAction | null {
  const reader = JsonObjectReader.from(value)
  if (!reader) return null
  const type = reader.string('type')
  const index = reader.number('index')
  if (!integer(index, 0, size - 1)) return null
  switch (type) {
    case 'scan':
    case 'reveal':
    case 'flag':
    case 'mark-safe':
    case 'chord':
      return { type, index }
    default:
      return null
  }
}

/** Own a separate envelope and contain browser privacy/quota errors at the persistence boundary. */
export class SonarRepository {
  private readonly storage: StorageLike
  available = true
  recovered = false
  records: readonly SonarRecord[] = []

  /** Receive the shared storage port without gaining access to any other ruleset's state. */
  constructor(storage: StorageLike) {
    this.storage = storage
  }

  /** Read current-format data only; incompatible journals are retired without old rule engines. */
  load(): SonarSave | null {
    this.records = []
    this.recovered = false
    let text: string | null
    try {
      text = this.storage.getItem(SONAR_STORAGE_KEY)
    } catch {
      this.available = false
      return null
    }
    if (text === null) return null

    this.recovered = true
    const reader = JsonObjectReader.from(parseJson(text))
    if (!reader) return null
    this.records = decodeRecords(reader.array('records'))
    const difficulty = sonarDifficulty(reader.string('difficulty'))
    const seed = reader.number('seed')
    const settled = reader.value('settled')
    const values = reader.array('actions')
    if (
      reader.number('version') !== 1 ||
      !difficulty ||
      !integer(seed, 0, 0xffffffff) ||
      typeof settled !== 'boolean' ||
      !values ||
      values.length > SONAR_ACTION_LIMIT
    )
      return null

    const config = PRESETS[difficulty]
    const actions: SonarAction[] = []
    for (const value of values) {
      const action = decodeAction(value, config.width * config.height)
      if (!action) return null
      actions.push(action)
    }
    this.recovered = false
    return { version: 1, difficulty, seed, actions, settled, records: this.records }
  }

  /** Progress and newly earned records become durable in one write. */
  save(value: SonarSave): void {
    try {
      this.storage.setItem(SONAR_STORAGE_KEY, JSON.stringify(value))
    } catch {
      this.available = false
    }
  }
}
