import { validConfig } from '../game/engine.js'
import type { Config, GameSnapshot, Visibility } from '../types/game.js'
import type { JsonValue } from '../types/json.js'
import type { LegacyScores, Score, StoredSession } from '../types/storage.js'
import { JsonObjectReader, parseJson } from './json-reader.js'

/** Build a board configuration from finite numeric fields and domain bounds. */
function decodeConfig(reader: JsonObjectReader | null): Config | null {
  if (!reader) {
    return null
  }

  const width = reader.number('width')
  const height = reader.number('height')
  const mines = reader.number('mines')

  if (width === null || height === null || mines === null) {
    return null
  }

  const config: Config = { width, height, mines }
  return validConfig(config) ? config : null
}

/** Convert one serialized state name into the allowed visibility union. */
function decodeVisibility(value: JsonValue): Visibility | null {
  switch (value) {
    case 'hidden':
    case 'revealed':
    case 'flagged':
      return value
    default:
      return null
  }
}

/** Construct a typed snapshot after checking its complete serialized shape. */
function decodeSnapshotValue(value: JsonValue): GameSnapshot | null {
  const reader = JsonObjectReader.from(value)

  if (!reader) {
    return null
  }

  const config = decodeConfig(reader.child('config'))
  const seed = reader.number('seed')
  const firstClick = reader.value('firstClick') === null ? null : reader.number('firstClick')
  const rawVisibility = reader.array('visible')

  if (!config || seed === null || !Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) {
    return null
  }

  // Null is a valid untouched board; a missing or malformed first-click field is not.
  if (firstClick === null && reader.value('firstClick') !== null) {
    return null
  }

  const cellCount = config.width * config.height

  if (
    firstClick !== null &&
    (!Number.isInteger(firstClick) || firstClick < 0 || firstClick >= cellCount)
  ) {
    return null
  }

  if (!rawVisibility || rawVisibility.length !== cellCount) {
    return null
  }

  const visible: Visibility[] = []

  for (const item of rawVisibility) {
    const visibility = decodeVisibility(item)

    if (visibility === null) {
      return null
    }

    visible.push(visibility)
  }

  return { config, seed, firstClick, visible }
}

/** Decode external snapshot text; the pure engine receives only GameSnapshot values. */
export function decodeGameSnapshot(text: string | null): GameSnapshot | null {
  return decodeSnapshotValue(parseJson(text))
}

/** Decode the current versioned progress envelope before the repository restores its game. */
export function decodeSession(text: string | null): StoredSession | null {
  const reader = JsonObjectReader.from(parseJson(text))

  if (!reader || reader.number('version') !== 1) {
    return null
  }

  const elapsed = reader.number('elapsed')
  const game = decodeSnapshotValue(reader.value('game') ?? null)

  return elapsed !== null && elapsed >= 0 && game ? { version: 1, game, elapsed } : null
}

/** Build one leaderboard record from validated strings, duration, and calendar date. */
function decodeScore(value: JsonValue): Score | null {
  const reader = JsonObjectReader.from(value)

  if (!reader) {
    return null
  }

  const id = reader.string('id')
  const name = reader.string('name')
  const milliseconds = reader.number('milliseconds')
  const date = reader.string('date')

  if (
    id === null ||
    name === null ||
    name.length > 32 ||
    milliseconds === null ||
    milliseconds < 0 ||
    date === null ||
    !Number.isFinite(Date.parse(date))
  ) {
    return null
  }

  return { id, name, milliseconds, date }
}

/** Decode valid records while preserving recoverable entries beside malformed ones. */
export function decodeScores(text: string | null): Score[] {
  const values = parseJson(text)

  if (!Array.isArray(values)) {
    return []
  }

  const scores: Score[] = []

  for (const value of values) {
    const score = decodeScore(value)

    if (score) {
      scores.push(score)
    }
  }

  return scores
}

/** Convert one original-edition time string into a modern numeric-time record. */
function decodeLegacyScore(value: JsonValue, index: number): Score | null {
  const reader = JsonObjectReader.from(value)
  const name = reader?.string('ID') ?? null
  const time = reader?.string('time') ?? null

  if (name === null || time === null) {
    return null
  }

  const match = /^(\d{1,5})h(\d{1,2})min(\d{1,2})s$/.exec(time)

  if (!match) {
    return null
  }

  const seconds = Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3])
  return {
    id: `legacy-${index}`,
    name,
    milliseconds: seconds * 1000,
    date: new Date(0).toISOString(),
  }
}

/** Decode a legacy rank list, retaining the original order and bounded import size. */
function decodeLegacyList(reader: JsonObjectReader, key: string): Score[] {
  const values = reader.array(key) ?? []
  const scores: Score[] = []

  for (const [index, value] of values.slice(0, 10).entries()) {
    const score = decodeLegacyScore(value, index)

    if (score) {
      scores.push(score)
    }
  }

  return scores
}

/** Expose a fixed three-difficulty legacy model instead of a dynamic property bag. */
export function decodeLegacyScores(text: string | null): LegacyScores | null {
  const reader = JsonObjectReader.from(parseJson(text))

  return reader
    ? {
        easy: decodeLegacyList(reader, 'easyRank'),
        medium: decodeLegacyList(reader, 'hardRank'),
        expert: decodeLegacyList(reader, 'extraRank'),
      }
    : null
}
