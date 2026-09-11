import { parseCombatPurchase } from '../game/combat-build.js'
import { parseRelicPack } from '../game/relic-packs.js'
import { message } from '../i18n.js'
import type { Language } from '../types/localization.js'
import type { VariantDifficulty } from '../types/variant-difficulty.js'
import type { VariantDescription, VariantMessages } from '../types/variant-ui.js'
import type { Equipment, Profession, Relic, Upgrade } from '../types/variants.js'
import { combatPurchaseCopy, combatRelicCopy } from './combat-build-copy.js'
import { expansionRelicCopy, relicPackCopy } from './relic-expansion-copy.js'

/** Supply complete, explicit labels for the special-mode UI. */
export function variantCopy(language: Language): VariantMessages {
  return {
    difficulty: message(language, 'variant-copy.difficulty'),
    legacyDifficulty: message(language, 'variant-copy.original-rules'),
    nextFloor: message(language, 'variant-copy.continue-to-next-floor'),
    zoom: message(language, 'variant-copy.larger-cells'),
    fit: message(language, 'variant-copy.fit-board'),
    zoomHint: message(language, 'variant-copy.scroll-or-swipe-to-explore-the-enlarged'),
    confirmedMine: message(language, 'variant-copy.confirmed-mine-locked-flag'),
    triggeredMine: message(language, 'variant-copy.triggered-mine'),
    confirmedSafe: message(language, 'variant-copy.confirmed-safe'),
    rowMines: message(language, 'variant-copy.mines-total'),
    controls: message(language, 'variant-copy.arrows-home-end-move-focus-enter-space'),
    modes: message(language, 'variant-copy.game-mode'),
    classic: message(language, 'variant-copy.classic'),
    expedition: message(language, 'variant-copy.expedition'),
    twin: message(language, 'variant-copy.twin-boards'),
    camp: message(language, 'variant-copy.base-camp'),
    supplies: message(language, 'variant-copy.supplies'),
    departures: message(language, 'variant-copy.completed-expeditions'),
    start: message(language, 'variant-copy.begin-expedition'),
    profession: message(language, 'variant-copy.profession'),
    equipment: message(language, 'variant-copy.loadout-3-points'),
    facilities: message(language, 'variant-copy.camp-facilities'),
    owned: message(language, 'variant-copy.unlocked'),
    locked: message(language, 'variant-copy.unlock-at-camp'),
    floor: message(language, 'variant-copy.floor'),
    loot: message(language, 'variant-copy.run-loot'),
    probes: message(language, 'variant-copy.probes'),
    scans: message(language, 'variant-copy.scans'),
    health: message(language, 'variant-copy.health'),
    shields: message(language, 'variant-copy.shields'),
    probe: message(language, 'variant-copy.probe-3-3-area'),
    scan: message(language, 'variant-copy.scan-a-row'),
    wall: message(language, 'variant-copy.wall-impassable'),
    player: message(language, 'variant-copy.explorer'),
    migrated: message(language, 'variant-copy.camp-and-results-preserved-the-previous-dungeon'),
    retreat: message(language, 'variant-copy.extract-to-camp'),
    retreatNote: message(language, 'variant-copy.end-this-expedition-and-bank-all-collected'),
    chooseRelic: message(language, 'variant-copy.choose-a-relic'),
    floorCleared: message(language, 'variant-copy.floor-cleared'),
    viewResult: message(language, 'variant-copy.view-results'),
    reward: message(language, 'variant-copy.choose-one-relic-for-the-next-floor'),
    exit: message(language, 'variant-copy.exit'),
    entrance: message(language, 'variant-copy.entrance'),
    treasure: message(language, 'variant-copy.treasure-safe'),
    collected: message(language, 'variant-copy.collected'),
    frontier: message(language, 'variant-copy.reachable-frontier'),
    relics: message(language, 'variant-copy.relic-build'),
    relicUsedFloor: message(language, 'variant-copy.used-this-floor'),
    relicUsedRun: message(language, 'variant-copy.used-this-expedition'),
    relicUsedTurn: message(language, 'variant-copy.used-this-turn'),
    noRelics: message(language, 'variant-copy.find-your-first-relic-after-floor-one'),
    earned: message(language, 'variant-copy.banked-supplies'),
    rewardRate: message(language, 'variant-copy.difficulty-reward'),
    rewardBase: message(language, 'variant-copy.base-settlement'),
    rewardBonus: message(language, 'variant-copy.difficulty-bonus'),
    won: message(language, 'variant-copy.expedition-complete'),
    lost: message(language, 'variant-copy.expedition-ended'),
    retreated: message(language, 'variant-copy.safely-extracted'),
    steps: message(language, 'variant-copy.moves'),
    records: message(language, 'variant-copy.recent-results-this-mode'),
    noRecords: message(language, 'variant-copy.your-story-starts-here'),
    expeditionHelp: message(language, 'variant-copy.click-revealed-floor-to-walk-there-along'),
    twinHelp: message(language, 'variant-copy.at-each-coordinate-at-most-one-board'),
    campHelp: message(language, 'variant-copy.choose-your-difficulty-and-expedition-length-build'),
    ready: message(language, 'variant-copy.choose-the-first-opening-on-either-board'),
    exploring: message(language, 'variant-copy.find-a-safe-route-to-the-exit'),
    exitReady: message(language, 'variant-copy.stairs-reachable-click-them-when-ready-to'),
    partner: message(language, 'variant-copy.matching-coordinate'),
    safePartner: message(language, 'variant-copy.partner-cleared-flagged-mines-there-are-now'),
    recovered: message(language, 'variant-copy.an-incompatible-or-damaged-save-was-ignored'),
    journalLimit: message(language, 'variant-copy.this-run-reached-the-move-limit-extract'),
    toolHint: message(language, 'variant-copy.drag-a-tool-onto-the-board-or'),
    probeHint: message(language, 'variant-copy.inspect-a-3-3-area-gold-flags'),
    scanHint: message(language, 'variant-copy.inspect-a-whole-row-gold-flags-mark'),
  }
}

/** Describe career tradeoffs with exact starting resources. */
export function professionCopy(language: Language, profession: Profession): VariantDescription {
  switch (profession) {
    case 'rescuer':
      return { name: message(language, 'rescuer.name'), note: message(language, 'rescuer.note') }
    case 'waymarker':
      return {
        name: message(language, 'variant-copy.waymarker'),
        note: message(language, 'variant-copy.mission-exclusive-clear-12-floors-and-claim'),
      }
    case 'riftwalker':
      return {
        name: message(language, 'variant-copy.riftwalker'),
        note: message(language, 'variant-copy.achievement-exclusive-clear-50-floors-and-claim'),
      }
    case 'archaeologist':
      return {
        name: message(language, 'variant-copy.archaeologist'),
        note: message(language, 'variant-copy.1-probe-scout-a-chest-each-floor'),
      }
    case 'alchemist':
      return {
        name: message(language, 'variant-copy.alchemist'),
        note: message(language, 'variant-copy.2-shields-each-floor-1-shield-1'),
      }
    case 'sentinel':
      return {
        name: message(language, 'variant-copy.sentinel'),
        note: message(language, 'variant-copy.1-probe-1-shield-each-floor-1'),
      }
    case 'explorer':
      return {
        name: message(language, 'variant-copy.explorer-2'),
        note: message(language, 'variant-copy.2-probes-1-scan'),
      }
    case 'surveyor':
      return {
        name: message(language, 'variant-copy.surveyor'),
        note: message(language, 'variant-copy.1-probe-2-scans'),
      }
    case 'engineer':
      return {
        name: message(language, 'variant-copy.engineer'),
        note: message(language, 'variant-copy.1-probe-1-scan-1-shield'),
      }
  }
}

/** Explain each temporary relic's exact effect and resource cap. */
export function relicCopy(language: Language, relic: Relic): VariantDescription {
  switch (relic) {
    case 'chest-beacon':
      return {
        name: message(language, 'variant-copy.chest-beacon'),
        note: message(language, 'variant-copy.collect-a-chest-to-scout-the-next'),
      }
    case 'pulse-coil':
      return {
        name: message(language, 'variant-copy.pulse-coil'),
        note: message(language, 'variant-copy.completing-a-profession-skill-scouts-your-landing'),
      }
    case 'last-bastion':
      return {
        name: message(language, 'variant-copy.last-bastion'),
        note: message(language, 'variant-copy.survive-health-damage-with-2-hp-or'),
      }
    case 'hunter-seal':
      return {
        name: message(language, 'variant-copy.hunter-seal'),
        note: message(language, 'variant-copy.confirm-8-distinct-mines-in-a-floor'),
      }
    case 'fault-map':
      return {
        name: message(language, 'variant-copy.fault-map'),
        note: message(language, 'variant-copy.confirm-4-distinct-mines-in-a-floor'),
      }
    case 'abyss-hourglass':
      return {
        name: message(language, 'variant-copy.abyss-hourglass'),
        note: message(language, 'variant-copy.revive-at-3-hp-and-scout-your'),
      }
    case 'trail-heart':
      return {
        name: message(language, 'variant-copy.trail-heart'),
        note: message(
          language,
          'variant-copy.achievement-exclusive-the-first-chest-collected-each',
        ),
      }
    case 'survey-token':
      return {
        name: message(language, 'variant-copy.survey-token'),
        note: message(language, 'variant-copy.achievement-exclusive-confirm-5-unique-mines-in'),
      }
    case 'lantern':
      return {
        name: message(language, 'variant-copy.lantern'),
        note: message(language, 'variant-copy.1-probe-on-each-new-floor-up'),
      }
    case 'lens':
      return {
        name: message(language, 'variant-copy.survey-lens'),
        note: message(language, 'variant-copy.1-scan-on-each-new-floor-up'),
      }
    case 'aegis':
      return {
        name: message(language, 'variant-copy.aegis'),
        note: message(language, 'variant-copy.gain-1-shield-up-to-2-absorbs'),
      }
    case 'purse':
      return {
        name: message(language, 'variant-copy.treasure-pouch'),
        note: message(language, 'variant-copy.future-treasures-give-9-supplies-instead-of'),
      }
    case 'compass':
      return {
        name: message(language, 'variant-copy.exit-compass'),
        note: message(language, 'variant-copy.scout-the-exit-s-3-3-area'),
      }
    case 'salvage':
      return {
        name: message(language, 'variant-copy.salvage-seal'),
        note: message(language, 'variant-copy.keep-75-of-collected-loot-on-defeat'),
      }
    case 'tempered-edge':
    case 'layered-armor':
    case 'tactics-hourglass':
      return combatRelicCopy(language, relic)
    default:
      return expansionRelicCopy(language, relic)
  }
}

/** Describe finite camp unlocks without hiding their actual gameplay consequence. */
export function upgradeCopy(language: Language, upgrade: Upgrade): VariantDescription {
  if (upgrade === 'sonar') return equipmentCopy(language, 'sonar')
  const combat = parseCombatPurchase(upgrade)
  if (combat) return combatPurchaseCopy(language, combat)
  if (
    upgrade === 'surveyor' ||
    upgrade === 'engineer' ||
    upgrade === 'archaeologist' ||
    upgrade === 'alchemist' ||
    upgrade === 'sentinel'
  )
    return professionCopy(language, upgrade)
  const pack = parseRelicPack(upgrade)
  if (pack) return relicPackCopy(language, pack)
  return upgrade === 'workshop'
    ? {
        name: message(language, 'variant-copy.workshop'),
        note: message(language, 'variant-copy.unlock-departure-equipment-choose-up-to-3'),
      }
    : {
        name: message(language, 'variant-copy.relic-archive'),
        note: message(language, 'variant-copy.add-exit-compass-and-salvage-seal-to'),
      }
}

/** Describe equipment costs and starting bonuses. */
export function equipmentCopy(language: Language, equipment: Equipment): VariantDescription {
  switch (equipment) {
    case 'sonar':
      return {
        name: message(language, 'sonar-equipment.name'),
        note: message(language, 'sonar-equipment.note'),
      }
    case 'field-radio':
      return {
        name: message(language, 'variant-copy.field-radio'),
        note: message(language, 'variant-copy.mission-exclusive-1-loadout-point-a-successful'),
      }
    case 'probe':
      return {
        name: message(language, 'variant-copy.probe-kit'),
        note: message(language, 'variant-copy.1-loadout-point-starting-probes-1'),
      }
    case 'scanner':
      return {
        name: message(language, 'variant-copy.scanner'),
        note: message(language, 'variant-copy.1-loadout-point-starting-scans-1'),
      }
    case 'guard':
      return {
        name: message(language, 'variant-copy.guard'),
        note: message(language, 'variant-copy.2-loadout-points-starting-shields-1'),
      }
    default:
      return combatPurchaseCopy(language, equipment)
  }
}

/** Name each finite tier in all supported locales, keeping old results explicitly separate. */
export function difficultyCopy(language: Language, difficulty?: VariantDifficulty): string {
  switch (difficulty) {
    case 'relaxed':
      return message(language, 'variant-copy.relaxed')
    case 'standard':
      return message(language, 'variant-copy.standard')
    case 'advanced':
      return message(language, 'variant-copy.advanced')
    case 'expert':
      return message(language, 'variant-copy.expert')
    case 'abyss':
      return message(language, 'variant-copy.abyss')
    default:
      return variantCopy(language).legacyDifficulty
  }
}

/** Explain update extraction without exposing storage versions or implementation details. */
export function returnedToCampCopy(language: Language, supplies: number): string {
  return message(language, 'variant-copy.game-updated-your-expedition-returned-to-camp', {
    p0: supplies,
  })
}
