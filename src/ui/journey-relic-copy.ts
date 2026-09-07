import { message } from '../i18n.js'
import type { Language } from '../types/localization.js'
import type { JourneyPack, JourneyRelic } from '../types/relic-packs.js'
import type { VariantDescription } from '../types/variant-ui.js'

/** Keep names, usable conditions and charge limits together in each supported language. */

/** Describe the twelve exploration and tactical effects at the point of selection. */
export function journeyRelicCopy(language: Language, relic: JourneyRelic): VariantDescription {
  switch (relic) {
    case 'trail-thread':
      return {
        name: message(language, 'journey-relic-copy.trail-thread'),
        note: message(language, 'journey-relic-copy.visit-12-new-safe-squares-to-gain'),
      }
    case 'landmark-lens':
      return {
        name: message(language, 'journey-relic-copy.landmark-lens'),
        note: message(language, 'journey-relic-copy.the-first-chest-collected-each-floor-surveys'),
      }
    case 'probe-recycler':
      return {
        name: message(language, 'journey-relic-copy.probe-recycler'),
        note: message(language, 'journey-relic-copy.refund-the-first-probe-each-floor-that'),
      }
    case 'spare-coil':
      return {
        name: message(language, 'journey-relic-copy.spare-coil'),
        note: message(language, 'journey-relic-copy.a-row-scan-confirming-at-least-2'),
      }
    case 'skill-capacitor':
      return {
        name: message(language, 'journey-relic-copy.skill-capacitor'),
        note: message(language, 'journey-relic-copy.using-your-profession-skill-grants-1-scan'),
      }
    case 'emergency-gears':
      return {
        name: message(language, 'journey-relic-copy.emergency-gears'),
        note: message(language, 'journey-relic-copy.use-a-row-scan-while-out-of'),
      }
    case 'marching-boots':
      return {
        name: message(language, 'journey-relic-copy.marching-boots'),
        note: message(language, 'journey-relic-copy.in-combat-your-first-walk-of-2'),
      }
    case 'shelter-cloak':
      return {
        name: message(language, 'journey-relic-copy.shelter-cloak'),
        note: message(language, 'journey-relic-copy.end-a-combat-turn-outside-the-warning'),
      }
    case 'breach-sigil':
      return {
        name: message(language, 'journey-relic-copy.breach-sigil'),
        note: message(language, 'journey-relic-copy.first-control-or-seal-disabled-or-anchor'),
      }
    case 'duelist-edge':
      return {
        name: message(language, 'journey-relic-copy.duelist-edge'),
        note: message(language, 'journey-relic-copy.first-strike-each-floor-4-damage'),
      }
    case 'reserve-watch':
      return {
        name: message(language, 'journey-relic-copy.reserve-watch'),
        note: message(language, 'journey-relic-copy.once-per-floor-end-a-turn-with'),
      }
    case 'second-hand':
      return {
        name: message(language, 'journey-relic-copy.second-hand'),
        note: message(language, 'journey-relic-copy.after-surviving-the-third-combat-turn-gain'),
      }
  }
}

/** Explain what each permanent license adds to future reward choices. */
export function journeyPackCopy(language: Language, pack: JourneyPack): VariantDescription {
  switch (pack) {
    case 'cartographer-charts':
      return {
        name: message(language, 'journey-relic-copy.cartographer-charts'),
        note: message(language, 'journey-relic-copy.add-trail-thread-and-landmark-lens-earn'),
      }
    case 'salvager-kit':
      return {
        name: message(language, 'journey-relic-copy.salvager-kit'),
        note: message(language, 'journey-relic-copy.add-probe-recycler-and-spare-coil-recover'),
      }
    case 'mechanist-gears':
      return {
        name: message(language, 'journey-relic-copy.mechanist-gears'),
        note: message(language, 'journey-relic-copy.add-skill-capacitor-and-emergency-gears-link'),
      }
    case 'wayfarer-tokens':
      return {
        name: message(language, 'journey-relic-copy.wayfarer-tokens'),
        note: message(language, 'journey-relic-copy.add-marching-boots-and-shelter-cloak-cheaper'),
      }
    case 'duelist-marks':
      return {
        name: message(language, 'journey-relic-copy.duelist-marks'),
        note: message(language, 'journey-relic-copy.add-breach-sigil-and-duelist-edge-recover'),
      }
    case 'chronologist-dials':
      return {
        name: message(language, 'journey-relic-copy.chronologist-dials'),
        note: message(language, 'journey-relic-copy.add-reserve-watch-and-second-hand-bank'),
      }
  }
}
