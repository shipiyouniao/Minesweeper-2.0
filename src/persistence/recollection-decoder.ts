import {
  RECOLLECTION_BOSSES,
  RECOLLECTION_FLOORS,
  validRecollection,
  snapshotRecollection,
} from '../game/recollection.js'
import type { RecollectionSelection } from '../types/recollection.js'
import type { JsonValue } from '../types/json.js'
import { JsonObjectReader } from './json-reader.js'

/** Reject unknown identities, duplicates and empty pools before allocating a replay. */
export function decodeRecollection(value: JsonValue | undefined): RecollectionSelection | null {
  const reader = JsonObjectReader.from(value)
  const floors = reader?.array('floors')
  const bosses = reader?.array('bosses')
  if (!floors || !bosses) return null

  const selection: RecollectionSelection = {
    floors: floors.flatMap((value) => RECOLLECTION_FLOORS.filter((kind) => kind === value)),
    bosses: bosses.flatMap((value) => RECOLLECTION_BOSSES.filter((kind) => kind === value)),
  }
  return selection.floors.length === floors.length &&
    selection.bosses.length === bosses.length &&
    validRecollection(selection, { floors: RECOLLECTION_FLOORS, bosses: RECOLLECTION_BOSSES })
    ? snapshotRecollection(selection)
    : null
}
