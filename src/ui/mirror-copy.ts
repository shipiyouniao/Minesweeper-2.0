import { message } from '../i18n.js'

import { oppositeMirror } from '../game/mirror-state.js'
import type { Language } from '../types/localization.js'
import type { MirrorEncounter, MirrorSide } from '../types/mirror.js'
import type { TacticalMessages } from '../types/tactical-ui.js'

/** Name realms consistently across boards, controls, enemy cards and accessible labels. */
export function mirrorName(language: Language, side: MirrorSide): string {
  return side === 'dawn'
    ? message(language, 'mirror-copy.dawn')
    : message(language, 'mirror-copy.dusk')
}

/** Explain the twins' own deduction and turn rules while sharing the combat stat vocabulary. */
export function mirrorCopy(language: Language, common: TacticalMessages): TacticalMessages {
  /** Select complete authored translations for the encounter's short instructions. */

  const hint = message(language, 'mirror-copy.compare-both-realms-disable-each-seal-to')
  return {
    ...common,
    name: message(language, 'mirror-copy.mirror-twins'),
    hint,
    pylon: message(language, 'mirror-copy.mirror-seal-protects-the-opposite-twin'),
    disabled: message(language, 'mirror-copy.seal-disabled-opposite-twin-exposed'),
    help: [
      common.help[0]!,
      message(language, 'mirror-copy.the-same-coordinate-cannot-contain-a-mine'),
      message(language, 'mirror-copy.reveal-a-seal-correctly-flag-every-neighboring'),
      message(language, 'mirror-copy.shift-costs-1-ap-and-resumes-your'),
      message(language, 'mirror-copy.while-both-twins-live-striking-one-activates'),
      message(language, 'mirror-copy.dawn-alternates-rows-and-columns-dusk-alternates'),
      common.help.at(-1)!,
    ],
  }
}

/** Explain each twin's current gate independently of the player's distance or remaining AP. */
export function mirrorDefense(
  language: Language,
  encounter: MirrorEncounter,
  side: MirrorSide,
): string {
  const opposite = oppositeMirror(side)
  if (encounter[side].health === 0) return message(language, 'mirror-copy.defeated')

  if (encounter[opposite].seal.active)
    return message(language, 'mirror-copy.protected-by-seal', {
      p0: mirrorName(language, opposite),
    })

  if (encounter.lastStruck === side && encounter[opposite].health > 0)
    return message(language, 'mirror-copy.reflecting-strike-the-other-twin')

  return message(language, 'mirror-copy.exposed')
}
