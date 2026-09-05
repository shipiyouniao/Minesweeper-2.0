import { expeditionConfig, parseVariantDifficulty, twinConfig } from '../game/variant-difficulty.js'
import { parseRelicPack, RELIC_PACKS } from '../game/relic-packs.js'
import { UPGRADES } from '../game/camp-progression.js'
import {
  parseCombatEquipment,
  parseCombatPurchase,
  parseCombatTraining,
} from '../game/combat-build.js'
import type { CombatTraining } from '../types/combat-build.js'
import { encounterTier } from '../game/encounter-tiers.js'
import { EXPEDITION_RULES_REVISION, OLD_EXPEDITION_COMPENSATION } from './expedition-format.js'
import type { ExpeditionLoad } from '../types/variants.js'
import type { RelicPack } from '../types/relic-packs.js'
import type { Config } from '../types/game.js'
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
  switch (value) {
    case 'explorer':
    case 'surveyor':
    case 'engineer':
    case 'archaeologist':
    case 'alchemist':
    case 'sentinel':
      return value
    default:
      return null
  }
}

/** Accept only the declared exploration tools and combat equipment. */
export function parseEquipment(value: string | null): Equipment | null {
  return value === 'probe' || value === 'scanner' || value === 'guard'
    ? value
    : parseCombatEquipment(value)
}

/** Accept only defined permanent camp purchases. */
export function parseUpgrade(value: string | null): Upgrade | null {
  return value === 'surveyor' ||
    value === 'engineer' ||
    value === 'archaeologist' ||
    value === 'alchemist' ||
    value === 'sentinel' ||
    value === 'workshop' ||
    value === 'archive'
    ? value
    : (parseRelicPack(value) ?? parseCombatPurchase(value))
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
    case 'field-notes':
    case 'rangefinder':
    case 'reactive-shell':
    case 'rescue-ribbon':
    case 'field-dressing':
    case 'second-wind':
    case 'supply-cache':
    case 'cache-guard':
    case 'trail-thread':
    case 'landmark-lens':
    case 'probe-recycler':
    case 'spare-coil':
    case 'skill-capacitor':
    case 'emergency-gears':
    case 'marching-boots':
    case 'shelter-cloak':
    case 'breach-sigil':
    case 'duelist-edge':
    case 'reserve-watch':
    case 'second-hand':
    case 'tempered-edge':
    case 'layered-armor':
    case 'tactics-hourglass':
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
  if (
    !integer(supplies, Number.MAX_SAFE_INTEGER) ||
    !integer(completed, 1e6) ||
    !values ||
    values.length > UPGRADES.length
  )
    return null
  const upgrades: Upgrade[] = []

  for (const value of values) {
    const upgrade = parseUpgrade(typeof value === 'string' ? value : null)
    if (!upgrade || upgrades.includes(upgrade)) return null
    upgrades.push(upgrade)
  }

  return { supplies, completed, upgrades }
}

/** Decode only current departure options; obsolete runs never enter the game engine. */
function decodeDeparture(reader: JsonObjectReader | null): Departure | null {
  if (!reader) return null
  const seed = reader.number('seed')
  const difficulty = parseVariantDifficulty(reader.string('difficulty'))
  const profession = parseProfession(reader.string('profession'))
  const archive = reader.value('archive')
  const battleRelics = reader.value('battleRelics')
  const values = reader.array('equipment')
  const trainingValues = reader.array('training')
  const packValues = reader.array('packs')
  if (
    !integer(seed, 0xffffffff) ||
    !difficulty ||
    !profession ||
    typeof archive !== 'boolean' ||
    typeof battleRelics !== 'boolean' ||
    !values ||
    values.length > 3 ||
    !trainingValues ||
    trainingValues.length > 2 ||
    !packValues ||
    packValues.length > RELIC_PACKS.length
  )
    return null

  const equipment: Equipment[] = []
  const training: CombatTraining[] = []
  const packs: RelicPack[] = []
  for (const value of values) {
    const item = parseEquipment(typeof value === 'string' ? value : null)
    if (!item || equipment.includes(item)) return null
    equipment.push(item)
  }
  for (const value of trainingValues) {
    const item = parseCombatTraining(typeof value === 'string' ? value : null)
    if (!item || training.includes(item)) return null
    training.push(item)
  }
  for (const value of packValues) {
    const item = parseRelicPack(typeof value === 'string' ? value : null)
    if (!item || packs.includes(item)) return null
    packs.push(item)
  }
  return { seed, difficulty, profession, archive, equipment, training, packs, battleRelics }
}

/** Decode the payload selected by each expedition command discriminant. */
function decodeExpeditionAction(value: JsonValue, config: Config): ExpeditionAction | null {
  const reader = JsonObjectReader.from(value)
  if (!reader) return null
  const type = reader.string('type')

  switch (type) {
    case 'reveal':
    case 'move':
    case 'probe':
    case 'interact':
    case 'flag': {
      const index = reader.number('index')
      return integer(index, config.width * config.height - 1) ? { type, index } : null
    }
    case 'sweep': {
      const row = reader.number('row')
      return integer(row, config.height - 1) ? { type, row } : null
    }
    case 'descend':
    case 'skill':
    case 'attack':
    case 'brace':
    case 'end-turn':
    case 'shift':
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
  if (!reader || reader.number('rulesRevision') !== EXPEDITION_RULES_REVISION) return null
  const returnSupplies = reader.number('returnSupplies')
  if (!integer(returnSupplies, 10000)) return null
  const departure = decodeDeparture(reader.child('departure'))
  const values = reader.array('actions')
  if (!departure || !values || values.length > MAX_ACTIONS) return null
  const actions: ExpeditionAction[] = []
  const ordinary = expeditionConfig(departure, 1)
  const arena = encounterTier(departure.difficulty).config
  // Decode the broad dimension envelope; replay still validates each action against its actual room.
  const bounds = {
    ...ordinary,
    width: Math.max(ordinary.width, arena.width),
    height: Math.max(ordinary.height, arena.height),
  }

  for (const value of values) {
    const action = decodeExpeditionAction(value, bounds)
    if (!action) return null
    actions.push(action)
  }

  return { departure, actions, rulesRevision: EXPEDITION_RULES_REVISION, returnSupplies }
}

/** Retain a bounded list of fully valid records; no player-provided HTML is stored. */
function decodeRecords(values: readonly JsonValue[] | null): VariantRecord[] | null {
  if (!values || values.length > 60) return null
  const records: VariantRecord[] = []

  for (const value of values) {
    const reader = JsonObjectReader.from(value)
    if (!reader) return null
    const difficulty = parseVariantDifficulty(reader.string('difficulty'))
    if (reader.value('difficulty') !== undefined && !difficulty) return null
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
      !integer(depth, 12) ||
      !integer(earned, 10000)
    )
      return null
    records.push({ date, outcome, steps, depth, earned, ...(difficulty ? { difficulty } : {}) })
  }

  return records
}

/** Reject oversized or incompatible envelopes before allocating replay work. */
function envelope(text: string | null, version = 1): JsonObjectReader | null {
  if (!text || text.length > 1500000) return null
  const reader = JsonObjectReader.from(parseJson(text))
  return reader?.number('version') === version ? reader : null
}

/** Normalize only the durable envelope; no retired generator or action replay is needed. */
export function loadExpeditionSave(text: string | null): ExpeditionLoad | null {
  const reader = envelope(text, 4) ?? envelope(text, 3) ?? envelope(text, 2) ?? envelope(text, 1)
  if (!reader) return null
  const camp = decodeCamp(reader.child('camp'))
  const records = decodeRecords(reader.array('records'))
  if (!camp || !records) return null
  const difficulty = parseVariantDifficulty(reader.string('difficulty'))
  const journalValue = reader.value('journal')
  const raw = reader.child('journal')
  const oldEnvelope = reader.number('version') !== 4
  const revision = raw?.number('rulesRevision') ?? null
  const oldRules =
    !oldEnvelope && raw !== null && integer(revision, 1e6) && revision !== EXPEDITION_RULES_REVISION
  let returnedSupplies: number | null = null
  if (oldEnvelope && journalValue !== null && journalValue !== undefined)
    returnedSupplies = OLD_EXPEDITION_COMPENSATION
  else if (raw && oldRules) {
    const checkpoint = raw.number('returnSupplies')
    returnedSupplies = integer(checkpoint, 10000) ? checkpoint : 0
  }

  // Crediting a valid camp must never produce a balance that the next load rejects.
  if (returnedSupplies !== null)
    returnedSupplies = Math.min(returnedSupplies, Number.MAX_SAFE_INTEGER - camp.supplies)

  const journal = oldEnvelope || oldRules ? null : decodeJournal(raw)
  const recovered = returnedSupplies === null && journalValue !== null && !journal
  const save: ExpeditionSave = {
    version: 4,
    camp:
      returnedSupplies === null ? camp : { ...camp, supplies: camp.supplies + returnedSupplies },
    journal,
    records,
    ...(difficulty ? { difficulty } : {}),
  }
  return { save, migrated: oldEnvelope || oldRules, recovered, returnedSupplies }
}

/** Expose normalized save data to callers that do not need recovery presentation metadata. */
export function decodeExpeditionSave(text: string | null): ExpeditionSave | null {
  return loadExpeditionSave(text)?.save ?? null
}

/** Decode paired board intents without accepting alternate board identifiers. */
function decodeTwinAction(value: JsonValue, config: Config): TwinAction | null {
  const reader = JsonObjectReader.from(value)
  if (!reader) return null
  const side = reader.string('side')
  const type = reader.string('type')
  const index = reader.number('index')

  return (side === 'a' || side === 'b') &&
    (type === 'reveal' || type === 'flag') &&
    integer(index, config.width * config.height - 1)
    ? { side, type, index }
    : null
}

/** Decode the twin schema independently of classic and expedition persistence. */
export function decodeTwinSave(text: string | null): TwinSave | null {
  const reader = envelope(text)
  if (!reader) return null
  const seed = reader.number('seed')
  const settled = reader.value('settled')
  const rules = reader.value('rules')
  const difficulty = parseVariantDifficulty(reader.string('difficulty'))
  if (
    rules === 'difficulty-v1'
      ? !difficulty
      : rules !== undefined || reader.value('difficulty') !== undefined
  )
    return null
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
    const action = decodeTwinAction(value, twinConfig(difficulty ?? undefined))
    if (!action) return null
    actions.push(action)
  }

  return {
    version: 1,
    seed,
    actions,
    records,
    settled,
    ...(difficulty ? { rules: 'difficulty-v1', difficulty } : {}),
  }
}
