/** Permanent theme licenses snapshot their contents into each new departure. */
export type RelicPack = 'survey-notes' | 'guardian-crests' | 'survival-charms' | 'prospector-seals'

/** Eight bounded effects introduced by the first four purchasable themes. */
export type ExpansionRelic =
  | 'field-notes'
  | 'rangefinder'
  | 'reactive-shell'
  | 'rescue-ribbon'
  | 'field-dressing'
  | 'second-wind'
  | 'supply-cache'
  | 'cache-guard'

/** A theme adds two distinct choices to the deterministic reward pool. */
export interface RelicPackDefinition {
  readonly id: RelicPack
  readonly relics: readonly [ExpansionRelic, ExpansionRelic]
}
