import type { RelicPack, RelicPackDefinition } from '../types/relic-packs.js'
import type { Camp, Departure, Relic } from '../types/variants.js'

export const RELIC_PACKS: readonly RelicPackDefinition[] = [
  { id: 'survey-notes', relics: ['field-notes', 'rangefinder'] },
  { id: 'guardian-crests', relics: ['reactive-shell', 'rescue-ribbon'] },
  { id: 'survival-charms', relics: ['field-dressing', 'second-wind'] },
  { id: 'prospector-seals', relics: ['supply-cache', 'cache-guard'] },
  { id: 'cartographer-charts', relics: ['trail-thread', 'landmark-lens'] },
  { id: 'salvager-kit', relics: ['probe-recycler', 'spare-coil'] },
  { id: 'mechanist-gears', relics: ['skill-capacitor', 'emergency-gears'] },
  { id: 'wayfarer-tokens', relics: ['marching-boots', 'shelter-cloak'] },
  { id: 'duelist-marks', relics: ['breach-sigil', 'duelist-edge'] },
  { id: 'chronologist-dials', relics: ['reserve-watch', 'second-hand'] },
]

/** Decode a finite license without accepting arbitrary saved identifiers. */
export function parseRelicPack(value: string | null): RelicPack | null {
  switch (value) {
    case 'survey-notes':
    case 'guardian-crests':
    case 'survival-charms':
    case 'prospector-seals':
    case 'cartographer-charts':
    case 'salvager-kit':
    case 'mechanist-gears':
    case 'wayfarer-tokens':
    case 'duelist-marks':
    case 'chronologist-dials':
      return value
    default:
      return null
  }
}

/** Copy owned themes in catalog order so acquisition order cannot alter seeded offers. */
export function ownedRelicPacks(camp: Camp): RelicPack[] {
  return RELIC_PACKS.filter((pack) => camp.upgrades.includes(pack.id)).map((pack) => pack.id)
}

/** Keep historical reward order exact; only new journals append their captured themes. */
export function relicPool(departure: Departure): Relic[] {
  const base: Relic[] = ['lantern', 'lens', 'aegis', 'purse']
  if (departure.archive) base.push('compass', 'salvage')
  if (departure.rules === 'relics-v1') {
    for (const pack of RELIC_PACKS)
      if (departure.packs?.includes(pack.id)) base.push(...pack.relics)
  }
  if (departure.encounters === 'tactics-v2' && departure.battleRelics)
    base.push('tempered-edge', 'layered-armor', 'tactics-hourglass')
  return base
}
