import { message } from '../i18n.js'
import type { Language } from '../types/localization.js'
import type { ExpansionRelic, RelicPack } from '../types/relic-packs.js'
import type { VariantDescription } from '../types/variant-ui.js'
import { journeyPackCopy, journeyRelicCopy } from './journey-relic-copy.js'

/** Describe trigger conditions and limits where players select a relic. */
export function expansionRelicCopy(language: Language, relic: ExpansionRelic): VariantDescription {
  switch (relic) {
    case 'field-notes':
      return {
        name: message(language, 'relic-expansion-copy.field-notes'),
        note: message(language, 'relic-expansion-copy.confirm-3-mines-on-a-floor-to'),
      }
    case 'rangefinder':
      return {
        name: message(language, 'relic-expansion-copy.rangefinder'),
        note: message(language, 'relic-expansion-copy.a-probe-confirming-2-new-mines-grants'),
      }
    case 'reactive-shell':
      return {
        name: message(language, 'relic-expansion-copy.reactive-shell'),
        note: message(language, 'relic-expansion-copy.the-first-shielded-mine-hit-each-floor'),
      }
    case 'rescue-ribbon':
      return {
        name: message(language, 'relic-expansion-copy.rescue-ribbon'),
        note: message(language, 'relic-expansion-copy.survive-health-damage-to-gain-1-shield'),
      }
    case 'field-dressing':
      return {
        name: message(language, 'relic-expansion-copy.field-dressing'),
        note: message(language, 'relic-expansion-copy.first-chest-each-floor-restores-5-health'),
      }
    case 'second-wind':
      return {
        name: message(language, 'relic-expansion-copy.second-wind'),
        note: message(
          language,
          'relic-expansion-copy.once-per-expedition-survive-lethal-damage-with',
        ),
      }
    case 'supply-cache':
      return {
        name: message(language, 'relic-expansion-copy.supply-cache'),
        note: message(language, 'relic-expansion-copy.the-first-chest-collected-each-floor-grants'),
      }
    case 'cache-guard':
      return {
        name: message(language, 'relic-expansion-copy.cache-guard'),
        note: message(language, 'relic-expansion-copy.collect-all-3-chests-on-a-floor'),
      }
    default:
      return journeyRelicCopy(language, relic)
  }
}

/** A purchase adds options to later reward offers, never an immediate free relic. */
export function relicPackCopy(language: Language, pack: RelicPack): VariantDescription {
  switch (pack) {
    case 'survey-notes':
      return {
        name: message(language, 'relic-expansion-copy.surveyor-notes'),
        note: message(language, 'relic-expansion-copy.add-field-notes-and-rangefinder-to-future'),
      }
    case 'guardian-crests':
      return {
        name: message(language, 'relic-expansion-copy.guardian-crests'),
        note: message(language, 'relic-expansion-copy.add-reactive-shell-and-rescue-ribbon-shield'),
      }
    case 'survival-charms':
      return {
        name: message(language, 'relic-expansion-copy.survival-charms'),
        note: message(language, 'relic-expansion-copy.add-field-dressing-and-second-wind-chest'),
      }
    case 'prospector-seals':
      return {
        name: message(language, 'relic-expansion-copy.prospector-seals'),
        note: message(language, 'relic-expansion-copy.add-supply-cache-and-cache-guard-recover'),
      }
    default:
      return journeyPackCopy(language, pack)
  }
}
