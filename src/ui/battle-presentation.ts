import { gameplayStyles } from './gameplay-styles.js'
import { combatStats } from '../game/combat-build.js'
import { message } from '../i18n.js'
import type { Language } from '../types/localization.js'
import type { TacticalMessages } from '../types/tactical-ui.js'
import type { EncounterKind, TacticalEncounter } from '../types/tactical.js'
import type { Expedition } from '../types/variants.js'
import { clockCopy, clockStatus } from './clock-copy.js'
import { combatPurchaseCopy } from './combat-build-copy.js'
import { magneticCopy, magneticStatus } from './magnetic-copy.js'
import { milestoneCopy } from './milestone-copy.js'
import { mirrorCopy, mirrorDefense } from './mirror-copy.js'
import { titleEffectCopy } from './title-copy.js'
import { equipmentCopy, relicCopy } from './variant-copy.js'

/** Keep current rules and boss-specific instructions together in every language. */
export function battleCopy(language: Language, kind: EncounterKind): TacticalMessages {
  /** Keep every new instruction complete in all supported languages. */

  const hint =
    kind === 'bastion'
      ? message(language, 'battle-presentation.reveal-each-control-and-flag-its-neighboring')
      : message(language, 'battle-presentation.reveal-nests-and-flag-their-neighboring-mines')
  const copy: TacticalMessages = {
    name:
      kind === 'bastion'
        ? message(language, 'battle-presentation.bastion-guardian')
        : message(language, 'battle-presentation.brood-queen'),
    turn: message(language, 'battle-presentation.turn'),
    points: message(language, 'battle-presentation.action-points'),
    armor: message(language, 'battle-presentation.defenses'),
    exposed: message(language, 'battle-presentation.core-exposed'),
    disabled: message(language, 'battle-presentation.control-disabled'),
    attack: message(language, 'battle-presentation.strike-2-ap'),
    brace: message(language, 'battle-presentation.brace-1-ap'),
    end: message(language, 'battle-presentation.end-turn'),
    excavation: message(
      language,
      'battle-presentation.scout-the-nearest-active-objective-with-undiscovered',
    ),
    victory: message(language, 'battle-presentation.boss-defeated-full-health-1-shield'),
    hint,
    danger: message(language, 'battle-presentation.enemy-attack-forecast'),
    pylon: message(language, 'battle-presentation.control-reveal-and-flag-neighboring-mines'),
    help: [
      message(language, 'battle-presentation.base-stats-10-health-5-attack-0'),
      hint,
      kind === 'bastion'
        ? message(language, 'battle-presentation.the-amber-control-reduces-future-attacks-from')
        : message(language, 'battle-presentation.each-nest-gives-3-armor-and-heals'),
      kind === 'brood'
        ? message(language, 'battle-presentation.eggs-hatch-after-two-turns-hatchlings-advance')
        : message(language, 'battle-presentation.row-column-and-cross-attacks-remain-fixed'),
      message(language, 'battle-presentation.brace-reduces-this-turn-s-enemy-damage'),
    ],
  }
  if (kind === 'echo')
    return {
      ...copy,
      name: message(language, 'echo.name'),
      hint: message(language, 'echo.locate'),
      pylon: message(language, 'echo.shell'),
      help: [
        message(language, 'echo.locate'),
        message(language, 'echo.shell'),
        message(language, 'echo.fight'),
        message(language, 'echo.phase-note'),
        message(language, 'echo.rhythm'),
      ],
    }
  if (kind === 'clock') return clockCopy(language, copy)
  return kind === 'magnetic'
    ? magneticCopy(language, copy)
    : kind === 'mirror'
      ? mirrorCopy(language, copy)
      : copy
}

/** Summarize the actual remaining objectives and core window, rather than a generic boss phase. */
export function battleStatus(language: Language, encounter: TacticalEncounter): string {
  if (encounter.kind === 'echo')
    return message(language, 'echo.status', {
      phase: encounter.phase,
      window: Math.max(0, encounter.exposedUntil - encounter.turn + 1),
    })
  if (encounter.kind === 'clock') return clockStatus(language, encounter)
  if (encounter.kind === 'magnetic') return magneticStatus(language, encounter)
  if (encounter.kind === 'mirror') return mirrorDefense(language, encounter, encounter.active)
  if (encounter.kind === 'brood')
    return message(language, 'battle-presentation.nests-3-armor-regen', {
      p0: encounter.nests.length,
      p1: encounter.nests.length * 3,
    })
  const active = encounter.pylons.filter((pylon) => pylon.active).length
  const window = Math.max(0, encounter.exposedUntil - encounter.turn + 1)
  return active
    ? message(language, 'battle-presentation.controls-2', { p0: active })
    : window
      ? message(language, 'battle-presentation.core-open-turns', { p0: window })
      : message(language, 'battle-presentation.approach-and-prime-the-core-1-ap')
}

/** Show derived stats and explicit equipment/relic/training sources together. */
export function combatStatsTemplate(language: Language, run: Expedition): string {
  const stats = combatStats(run)
  const equipment = run.departure.equipment.filter(
    (item) => item !== 'probe' && item !== 'scanner' && item !== 'guard',
  )
  const sources = [
    ...(run.departure.title
      ? [
          {
            name: milestoneCopy(language, run.departure.title).name,
            note: titleEffectCopy(language, run.departure.title),
          },
        ]
      : []),
    ...equipment.map((item) => equipmentCopy(language, item)),
    ...run.departure.training.map((item) => combatPurchaseCopy(language, item)),
    ...run.relics.map((item) => relicCopy(language, item)),
  ]
  const entries = sources
    .map((source) => `<li><strong>${source.name}</strong> · ${source.note}</li>`)
    .join('')
  return `<div class="combat-stats ${gameplayStyles['combat-stats']}"><span>${message(language, 'battle-presentation.attack')} <strong>${stats.attack}</strong></span><span>${message(language, 'battle-presentation.defense')} <strong>${stats.defense}</strong></span><span>${message(language, 'battle-presentation.turn-ap')} <strong>${stats.actions}</strong></span></div><details class="combat-sources ${gameplayStyles['combat-sources']}"><summary>${message(language, 'battle-presentation.build-effects')}</summary><p>${message(language, 'battle-presentation.base-5-attack-0-defense-3-ap')}</p>${entries ? `<ul>${entries}</ul>` : ''}</details>`
}
