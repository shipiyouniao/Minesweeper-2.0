import type { EncounterKind } from './tactical.js'
import type { DungeonLayout } from './dungeon-generation.js'
import type { FloorCircuits } from './floor-circuits.js'
import type { FloorPower } from './floor-power.js'

/** New families extend the same generated-room contract used by an expedition. */
export type RecollectionFloor = 'ordinary' | 'relay' | 'routing'

/** A departure takes its own copy; changing camp choices cannot alter a running memory. */
export interface RecollectionSelection {
  readonly floors: readonly RecollectionFloor[]
  readonly bosses: readonly EncounterKind[]
}

/** Generation supplies real mechanism state, consumed by the existing exploration rules. */
export interface RecollectionLayout extends DungeonLayout {
  readonly circuits?: FloorCircuits
  readonly power?: FloorPower
}

/** One translated floor card explains its actual interaction. */
export interface RecollectionFloorCopy {
  readonly name: string
  readonly note: string
}

/** Reached world performances are separate from dungeon campaign completion scenes. */
export type RegionalPerformanceId = 'reed-arrival' | 'recollection-light'

/** Planning uses node ordinals; placement later resolves them to physical board cells. */
export interface RecollectionFeed {
  readonly node: number
  readonly branch: 0 | 1
}

/** An acyclic power graph whose every terminal branch owns a required instrument. */
export interface RecollectionPowerPlan {
  readonly junctions: readonly (RecollectionFeed | null)[]
  readonly receivers: readonly RecollectionFeed[]
}
