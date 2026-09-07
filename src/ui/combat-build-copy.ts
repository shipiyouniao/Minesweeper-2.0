import { message } from '../i18n.js'
import type { CombatPurchase, CombatRelic } from '../types/combat-build.js'
import type { DungeonSprite } from '../types/dungeon-ui.js'
import type { Language } from '../types/localization.js'
import type { VariantDescription } from '../types/variant-ui.js'
import type { Equipment } from '../types/variants.js'

/** Require an English, Chinese and Japanese string at every new player-facing entry. */

/** Explain licenses and finite training without promising a number of runs to afford them. */
export function combatPurchaseCopy(language: Language, item: CombatPurchase): VariantDescription {
  switch (item) {
    case 'steel-blade':
      return {
        name: message(language, 'combat-build-copy.steel-blade'),
        note: message(language, 'combat-build-copy.2-loadout-points-attack-2'),
      }
    case 'plated-vest':
      return {
        name: message(language, 'combat-build-copy.plated-vest'),
        note: message(language, 'combat-build-copy.2-loadout-points-defense-1-against-enemy'),
      }
    case 'field-boots':
      return {
        name: message(language, 'combat-build-copy.field-boots'),
        note: message(language, 'combat-build-copy.2-loadout-points-1-ap-on-even'),
      }
    case 'medical-kit':
      return {
        name: message(language, 'combat-build-copy.medical-kit'),
        note: message(language, 'combat-build-copy.1-loadout-point-starting-and-maximum-health'),
      }
    case 'focus-lens':
      return {
        name: message(language, 'combat-build-copy.focus-lens'),
        note: message(language, 'combat-build-copy.1-loadout-point-the-first-control-or'),
      }
    case 'clearing-hook':
      return {
        name: message(language, 'combat-build-copy.clearing-hook'),
        note: message(language, 'combat-build-copy.1-loadout-point-the-first-web-egg'),
      }
    case 'battle-manual':
      return {
        name: message(language, 'combat-build-copy.battle-manual'),
        note: message(language, 'combat-build-copy.add-attack-defense-and-action-point-relics'),
      }
    case 'vitality-training':
      return {
        name: message(language, 'combat-build-copy.endurance-training'),
        note: message(language, 'combat-build-copy.one-purchase-only-starting-and-maximum-health'),
      }
    case 'weapon-training':
      return {
        name: message(language, 'combat-build-copy.weapon-training'),
        note: message(language, 'combat-build-copy.one-purchase-only-base-attack-1-on'),
      }
  }
}

/** Direct relic bonuses remain stronger than finite permanent training. */
export function combatRelicCopy(language: Language, relic: CombatRelic): VariantDescription {
  switch (relic) {
    case 'tempered-edge':
      return {
        name: message(language, 'combat-build-copy.tempered-edge'),
        note: message(language, 'combat-build-copy.attack-3-for-this-expedition'),
      }
    case 'layered-armor':
      return {
        name: message(language, 'combat-build-copy.layered-armor'),
        note: message(language, 'combat-build-copy.defense-1-against-enemy-attacks-for-this'),
      }
    case 'tactics-hourglass':
      return {
        name: message(language, 'combat-build-copy.tactics-hourglass'),
        note: message(language, 'combat-build-copy.1-ap-every-combat-turn-up-to'),
      }
  }
}

/** Reuse the matching project-owned inventory artwork for each tactical equipment role. */
export function combatSprite(item: CombatPurchase | Equipment | CombatRelic): DungeonSprite {
  switch (item) {
    case 'field-radio':
      return 'mechanist-gears'
    case 'steel-blade':
    case 'weapon-training':
    case 'tempered-edge':
      return 'bastion-strike'
    case 'plated-vest':
    case 'layered-armor':
      return 'guardian-crests'
    case 'field-boots':
      return 'wayfarer-tokens'
    case 'medical-kit':
    case 'vitality-training':
      return 'survival-charms'
    case 'focus-lens':
      return 'scanner'
    case 'clearing-hook':
      return 'salvager-kit'
    case 'battle-manual':
      return 'duelist-marks'
    case 'tactics-hourglass':
      return 'chronologist-dials'
    case 'guard':
      return 'shield'
    default:
      return item
  }
}

/** Present the new vitality scale consistently in camp, exploration and help. */
export function battleHealthCopy(language: Language): string {
  return message(language, 'combat-build-copy.mines-deal-5-damage-each-shield-absorbs')
}
