import { message } from '../i18n.js'
import type { Language } from '../types/localization.js'
import type { SkillAvailability } from '../types/profession.js'
import type { VariantDescription } from '../types/variant-ui.js'
import type { Profession } from '../types/variants.js'

/** Pick one complete translation without dynamic dictionaries or fallback keys. */

/** Explain the active skill separately from the concise starting-resource card. */
export function professionSkillCopy(
  language: Language,
  profession: Profession,
): VariantDescription {
  switch (profession) {
    case 'waymarker':
      return {
        name: message(language, 'profession-skill-copy.return-anchor'),
        note: message(language, 'profession-skill-copy.first-use-places-an-anchor-at-your'),
      }
    case 'riftwalker':
      return {
        name: message(language, 'profession-skill-copy.open-rift'),
        note: message(language, 'profession-skill-copy.choose-a-revealed-safe-landing-two-squares'),
      }
    case 'explorer':
      return {
        name: message(language, 'profession-skill-copy.trail-light'),
        note: message(language, 'profession-skill-copy.confirm-mines-and-safe-cells-in-the'),
      }
    case 'surveyor':
      return {
        name: message(language, 'profession-skill-copy.column-survey'),
        note: message(language, 'profession-skill-copy.confirm-mines-and-safe-cells-in-your'),
      }
    case 'engineer':
      return {
        name: message(language, 'profession-skill-copy.field-repair'),
        note: message(language, 'profession-skill-copy.spend-1-scan-to-gain-1-shield'),
      }
    case 'archaeologist':
      return {
        name: message(language, 'profession-skill-copy.excavate'),
        note: message(language, 'profession-skill-copy.scout-the-nearest-uncollected-chest-s-3'),
      }
    case 'alchemist':
      return {
        name: message(language, 'profession-skill-copy.transmute'),
        note: message(language, 'profession-skill-copy.spend-1-shield-to-gain-1-probe'),
      }
    case 'sentinel':
      return {
        name: message(language, 'profession-skill-copy.watchtower'),
        note: message(language, 'profession-skill-copy.spend-1-shield-to-confirm-mines-and'),
      }
  }
}

/** Present a short actionable availability message using only public resources and knowledge. */
export function professionSkillStatus(language: Language, status: SkillAvailability): string {
  switch (status) {
    case 'no-passage':
      return message(language, 'profession-skill-copy.reveal-a-safe-landing-across-a-confirmed')
    case 'blocked-anchor':
      return message(language, 'profession-skill-copy.move-away-from-the-anchor-its-landing')
    case 'ready':
      return message(language, 'profession-skill-copy.use-once-per-floor')
    case 'used':
      return message(language, 'profession-skill-copy.used-refreshes-next-floor')
    case 'resources':
      return message(language, 'profession-skill-copy.check-the-cost-and-resource-caps')
    case 'no-information':
      return message(
        language,
        'profession-skill-copy.no-new-information-here-reposition-or-explore',
      )
    case 'inactive':
      return message(language, 'profession-skill-copy.available-during-exploration')
  }
}
