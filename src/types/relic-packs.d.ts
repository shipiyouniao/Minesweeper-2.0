/** Permanent theme licenses snapshot their contents into each new departure. */
export type RelicPack =
  'survey-notes' | 'guardian-crests' | 'survival-charms' | 'prospector-seals' | JourneyPack

/** The second batch spans exploration, tool use and independent tactical rooms. */
export type JourneyPack =
  | 'cartographer-charts'
  | 'salvager-kit'
  | 'mechanist-gears'
  | 'wayfarer-tokens'
  | 'duelist-marks'
  | 'chronologist-dials'

/** Bounded effects from the ten purchasable themes. */
export type ExpansionRelic =
  | 'field-notes'
  | 'rangefinder'
  | 'reactive-shell'
  | 'rescue-ribbon'
  | 'field-dressing'
  | 'second-wind'
  | 'supply-cache'
  | 'cache-guard'
  | JourneyRelic

/** Twelve finite effects introduced with the tactical theme expansion. */
export type JourneyRelic =
  | 'trail-thread'
  | 'landmark-lens'
  | 'probe-recycler'
  | 'spare-coil'
  | 'skill-capacitor'
  | 'emergency-gears'
  | 'marching-boots'
  | 'shelter-cloak'
  | 'breach-sigil'
  | 'duelist-edge'
  | 'reserve-watch'
  | 'second-hand'

/** A theme adds two distinct choices to the deterministic reward pool. */
export interface RelicPackDefinition {
  readonly id: RelicPack
  readonly relics: readonly [ExpansionRelic, ExpansionRelic]
}
