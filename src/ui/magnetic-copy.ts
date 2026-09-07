import { message } from '../i18n.js'

import type { Language } from '../types/localization.js'
import type { MagneticEncounter, MagneticProjection } from '../types/magnetic.js'
import type { TacticalMessages } from '../types/tactical-ui.js'

/** Describe the station puzzle and visible pulse cycle alongside the shared combat vocabulary. */
export function magneticCopy(language: Language, common: TacticalMessages): TacticalMessages {
  /** Keep complete translations together for each player-facing rule. */

  const hint = message(language, 'magnetic-copy.clear-a-route-to-an-anchor-calibrate')
  return {
    ...common,
    name: message(language, 'magnetic-copy.magnetic-knight'),
    hint,
    disabled: message(language, 'magnetic-copy.anchor-calibrated-lure-committed'),
    help: [
      common.help[0]!,
      hint,
      message(language, 'magnetic-copy.arrows-show-the-next-magnetic-pulse-blue'),
      message(language, 'magnetic-copy.brace-for-1-ap-to-reduce-forced'),
      message(language, 'magnetic-copy.reveal-an-anchor-and-flag-its-surrounding'),
      message(language, 'magnetic-copy.activation-cancels-the-pulse-the-first-end'),
      message(language, 'magnetic-copy.a-crash-opens-the-entire-3-3'),
      common.help.at(-1)!,
    ],
  }
}

/** Label the phase without asking the player to decode a paragraph during a turn. */
export function magneticStatus(language: Language, encounter: MagneticEncounter): string {
  if (encounter.health === 0) return message(language, 'magnetic-copy.defeated')
  if (encounter.forecast.kind === 'charge')
    if (encounter.turn < encounter.forecast.resolvesOn)
      return message(language, 'magnetic-copy.charging-one-full-escape-turn-after-end')
    else return message(language, 'magnetic-copy.charge-at-end-turn-leave-the-route')
  const remaining = Math.max(0, encounter.exposedUntil - encounter.turn + 1)
  if (remaining) return message(language, 'magnetic-copy.core-exposed-turns', { p0: remaining })
  if (encounter.forecast.kind === 'recovery')
    return message(language, 'magnetic-copy.recharge-no-pulse')
  const horizontal = encounter.forecast.axis === 'horizontal'
  return encounter.forecast.polarity === 'pull'
    ? message(language, 'magnetic-copy.attract', {
        p0: horizontal
          ? message(language, 'magnetic-copy.horizontal')
          : message(language, 'magnetic-copy.vertical'),
      })
    : message(language, 'magnetic-copy.repel', {
        p0: horizontal
          ? message(language, 'magnetic-copy.horizontal')
          : message(language, 'magnetic-copy.vertical'),
      })
}

/** Announce a projected route using public certainty, never an unrevealed cell's actual contents. */
export function magneticLandingCopy(language: Language, projection: MagneticProjection): string {
  if (projection.anchored) return message(language, 'magnetic-copy.grounded-resist-displacement')
  if (projection.landing === 'mine')
    return message(language, 'magnetic-copy.known-mine-on-the-route')
  if (projection.landing === 'uncertain')
    return message(language, 'magnetic-copy.projected-route-unverified-cells')
  if (projection.collision)
    return message(language, 'magnetic-copy.collision-base-3-damage-reduced-by-defense')
  return message(language, 'magnetic-copy.projected-landing')
}
