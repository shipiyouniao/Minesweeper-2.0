import { JsonObjectReader, parseJson } from './json-reader.js'
import type { JsonValue } from '../types/json.js'
import type {
  Camp,
  Departure,
  Equipment,
  ExpeditionAction,
  ExpeditionJournal,
  ExpeditionSave,
  Profession,
  Relic,
  TwinAction,
  TwinSave,
  Upgrade,
  VariantRecord,
} from '../types/variants.js'

export const MAX_ACTIONS = 20000

/** Decode finite identifiers once at the external boundary. */
export function parseProfession(value: string | null): Profession | null {
  return value === 'explorer' || value === 'surveyor' || value === 'engineer' ? value : null
}

/** Accept only the three concrete equipment choices. */
export function parseEquipment(value: string | null): Equipment | null {
  return value === 'probe' || value === 'scanner' || value === 'guard' ? value : null
}

/** Accept only defined permanent camp purchases. */
export function parseUpgrade(value: string | null): Upgrade | null {
  return value === 'surveyor' || value === 'engineer' || value === 'workshop' || value === 'archive'
    ? value
    : null
}

/** Decode relic IDs without allowing arbitrary catalog keys. */
export function parseRelic(value: string | null): Relic | null {
  switch (value) {
    case 'lantern':
    case 'lens':
    case 'aegis':
    case 'purse':
    case 'compass':
    case 'salvage':
      return value
    default:
      return null
  }
}

/** Bound whole numeric fields before using them for loops, seeds or indices. */
function integer(value: number | null, maximum: number): value is number {
  return value !== null && Number.isInteger(value) && value >= 0 && value <= maximum
}

/** Build a camp value from currency, ownership and successful expedition count. */
function decodeCamp(reader: JsonObjectReader | null): Camp | null {
  if (!reader) return null
  const supplies = reader.number('supplies')
  const completed = reader.number('completed')
  const values = reader.array('upgrades')
  if (!integer(supplies, 1e9) || !integer(completed, 1e6) || !values || values.length > 4)
    return null
  const upgrades: Upgrade[] = []

  for (const value of values) {
    const upgrade = parseUpgrade(typeof value === 'string' ? value : null)
    if (!upgrade || upgrades.includes(upgrade)) return null
    upgrades.push(upgrade)
  }

  return { supplies, completed, upgrades }
}

/** Capture departure options; application replay additionally checks camp authorization. */
function decodeDeparture(reader: JsonObjectReader | null): Departure | null {
  if (!reader) return null
  const seed = reader.number('seed')
  const profession = parseProfession(reader.string('profession'))
  const archive = reader.value('archive')
  const values = reader.array('equipment')
  if (
    !integer(seed, 0xffffffff) ||
    !profession ||
    typeof archive !== 'boolean' ||
    !values ||
    values.length > 3
  )
    return null
  const equipment: Equipment[] = []

  for (const value of values) {
    const item = parseEquipment(typeof value === 'string' ? value : null)
    if (!item || equipment.includes(item)) return null
    equipment.push(item)
  }

  return { seed, profession, archive, equipment }
}

/** Decode the payload selected by each expedition command discriminant. */
function decodeExpeditionAction(value: JsonValue): ExpeditionAction | null {
  const reader = JsonObjectReader.from(value)
  if (!reader) return null
  const type = reader.string('type')

  switch (type) {
    case 'reveal':
    case 'move':
    case 'probe':
    case 'flag': {
      const index = reader.number('index')
      return integer(index, 80) ? { type, index } : null
    }
    case 'scan': {
      const row = reader.number('row')
      return integer(row, 8) ? { type, row } : null
    }
    case 'retreat':
      return { type }
    case 'relic': {
      const relic = parseRelic(reader.string('relic'))
      return relic ? { type, relic } : null
    }
    default:
      return null
  }
}

/** Decode a bounded replay journal, rejecting the whole run when any intent is malformed. */
function decodeJournal(reader: JsonObjectReader | null): ExpeditionJournal | null {
  if (!reader) return null
  const departure = decodeDeparture(reader.child('departure'))
  const values = reader.array('actions')
  if (!departure || !values || values.length > MAX_ACTIONS) return null
  const actions: ExpeditionAction[] = []

  for (const value of values) {
    const action = decodeExpeditionAction(value)
    if (!action) return null
    actions.push(action)
  }

  return { departure, actions }
}

/** Retain a bounded list of fully valid records; no player-provided HTML is stored. */
function decodeRecords(values: readonly JsonValue[] | null): VariantRecord[] | null {
  if (!values || values.length > 10) return null
  const records: VariantRecord[] = []

  for (const value of values) {
    const reader = JsonObjectReader.from(value)
    if (!reader) return null
    const date = reader.string('date')
    const outcome = reader.string('outcome')
    const steps = reader.number('steps')
    const depth = reader.number('depth')
    const earned = reader.number('earned')
    if (
      !date ||
      date.length > 40 ||
      !Number.isFinite(Date.parse(date)) ||
      (outcome !== 'won' && outcome !== 'lost' && outcome !== 'retreated') ||
      !integer(steps, MAX_ACTIONS) ||
      !integer(depth, 5) ||
      !integer(earned, 10000)
    )
      return null
    records.push({ date, outcome, steps, depth, earned })
  }

  return records
}

/** Reject oversized or incompatible envelopes before allocating replay work. */
function envelope(text: string | null, version = 1): JsonObjectReader | null {
  if (!text || text.length > 1500000) return null
  const reader = JsonObjectReader.from(parseJson(text))
  return reader?.number('version') === version ? reader : null
}

/** Decode camp and active run together because their settlement is one atomic transaction. */
export function decodeExpeditionSave(text: string | null): ExpeditionSave | null {
  const reader = envelope(text, 3) ?? envelope(text, 2) ?? envelope(text, 1)
  if (!reader) return null
  const camp = decodeCamp(reader.child('camp'))
  const records = decodeRecords(reader.array('records'))
  // Movement and terrain changed the generator. Keep camp and results, never replay an old route on a new layout.
  if (reader.number('version') !== 3)
    return camp && records ? { version: 3, camp, records, journal: null } : null
  const journal = decodeJournal(reader.child('journal'))
  if (!camp || !records || (reader.value('journal') !== null && !journal)) return null

  return { version: 3, camp, journal, records }
}

/** Decode paired board intents without accepting alternate board identifiers. */
function decodeTwinAction(value: JsonValue): TwinAction | null {
  const reader = JsonObjectReader.from(value)
  if (!reader) return null
  const side = reader.string('side')
  const type = reader.string('type')
  const index = reader.number('index')

  return (side === 'a' || side === 'b') &&
    (type === 'reveal' || type === 'flag') &&
    integer(index, 80)
    ? { side, type, index }
    : null
}

/** Decode the twin schema independently of classic and expedition persistence. */
export function decodeTwinSave(text: string | null): TwinSave | null {
  const reader = envelope(text)
  if (!reader) return null
  const seed = reader.number('seed')
  const settled = reader.value('settled')
  const records = decodeRecords(reader.array('records'))
  const values = reader.array('actions')
  if (
    !integer(seed, 0xffffffff) ||
    typeof settled !== 'boolean' ||
    !records ||
    !values ||
    values.length > MAX_ACTIONS
  )
    return null
  const actions: TwinAction[] = []

  for (const value of values) {
    const action = decodeTwinAction(value)
    if (!action) return null
    actions.push(action)
  }

  return { version: 1, seed, actions, records, settled }
}
