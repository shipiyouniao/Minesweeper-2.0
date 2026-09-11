import { SURVEY_PRESETS } from '../game/survey.js'
import { SURVEY_ACTION_LIMIT } from '../game/survey.js'
import { RANKED_DIFFICULTIES } from '../game/difficulty.js'
import type { Config, RankedDifficulty } from '../types/game.js'
import type { JsonValue } from '../types/json.js'
import type { SurveyAction, SurveyRecord, SurveySave } from '../types/survey.js'
import type { StorageLike } from '../types/storage.js'
import { JsonObjectReader, parseJson } from './json-reader.js'

export const SURVEY_STORAGE_KEY = 'minesweeper.survey.v1'

/** Parse only the three supported Survey presets, without classic URL aliases. */
export function surveyDifficulty(value: string | null): RankedDifficulty | null {
  return value === 'easy' || value === 'medium' || value === 'expert' ? value : null
}

/** Check bounded integer fields before constructing a journal action or result. */
function integer(value: number | null, low: number, high: number): value is number {
  return value !== null && Number.isInteger(value) && value >= low && value <= high
}

/** Preserve valid wins even when an unrelated active journal needs to be discarded. */
function decodeRecords(values: readonly JsonValue[] | null): readonly SurveyRecord[] {
  if (!values || values.length > 30) return []

  const records: SurveyRecord[] = []
  for (const value of values) {
    const reader = JsonObjectReader.from(value)
    if (!reader) continue

    const id = reader.string('id')
    const date = reader.string('date')
    const difficulty = surveyDifficulty(reader.string('difficulty'))
    const moves = reader.number('moves')
    if (
      !id ||
      id.length > 100 ||
      !date ||
      !Number.isFinite(Date.parse(date)) ||
      !difficulty ||
      !integer(moves, 1, SURVEY_ACTION_LIMIT) ||
      records.some((record) => record.id === id)
    )
      continue

    records.push({ id, date, difficulty, moves })
  }

  return rankSurveyRecords(records)
}

/** Retain ten best wins per preset, using the date to order equal move counts. */
export function rankSurveyRecords(records: readonly SurveyRecord[]): readonly SurveyRecord[] {
  return RANKED_DIFFICULTIES.flatMap((difficulty) =>
    records
      .filter((record) => record.difficulty === difficulty)
      .sort((left, right) => left.moves - right.moves || left.date.localeCompare(right.date))
      .slice(0, 10),
  )
}

/** Shape-check one finite command; replay subsequently verifies that it could be accepted. */
function decodeAction(value: JsonValue, config: Config): SurveyAction | null {
  const reader = JsonObjectReader.from(value)
  if (!reader) return null

  const type = reader.string('type')
  const index = reader.number('index')
  if (type === 'chord-line') {
    const axis = reader.string('axis')
    if (axis !== 'row' && axis !== 'column') return null

    return integer(index, 0, (axis === 'row' ? config.height : config.width) - 1)
      ? { type, axis, index }
      : null
  }

  if (!integer(index, 0, config.width * config.height - 1)) return null

  switch (type) {
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
export class SurveyRepository {
  private readonly storage: StorageLike
  available = true
  recovered = false
  records: readonly SurveyRecord[] = []

  /** Receive the shared storage port without gaining access to any other ruleset's state. */
  constructor(storage: StorageLike) {
    this.storage = storage
  }

  /** Read current-format data only; incompatible journals are retired without old rule engines. */
  load(): SurveySave | null {
    this.records = []
    this.recovered = false

    let text: string | null
    try {
      text = this.storage.getItem(SURVEY_STORAGE_KEY)
    } catch {
      this.available = false
      return null
    }

    if (text === null) return null

    this.recovered = true

    const reader = JsonObjectReader.from(parseJson(text))
    if (!reader) return null
    // Scores from different rules are not comparable; only current-format wins survive recovery.

    if (reader.number('version') !== 2) return null

    this.records = decodeRecords(reader.array('records'))

    const difficulty = surveyDifficulty(reader.string('difficulty'))
    const seed = reader.number('seed')
    const settled = reader.value('settled')
    const values = reader.array('actions')
    if (
      !difficulty ||
      !integer(seed, 0, 0xffffffff) ||
      typeof settled !== 'boolean' ||
      !values ||
      values.length > SURVEY_ACTION_LIMIT
    )
      return null

    const config = SURVEY_PRESETS[difficulty]
    const actions: SurveyAction[] = []
    for (const value of values) {
      const action = decodeAction(value, config)
      if (!action) return null

      actions.push(action)
    }

    this.recovered = false

    return { version: 2, difficulty, seed, actions, settled, records: this.records }
  }

  /** Progress and newly earned records become durable in one write. */
  save(value: SurveySave): void {
    try {
      this.storage.setItem(SURVEY_STORAGE_KEY, JSON.stringify(value))
    } catch {
      this.available = false
    }
  }
}
