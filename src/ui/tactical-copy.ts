import { message } from '../i18n.js'
import { matrixHealthFloor } from '../game/matrix-logic.js'
import type { Language } from '../types/localization.js'
import type { TacticalMessages } from '../types/tactical-ui.js'
import type { EncounterKind, TacticalEncounter, TacticalPlan } from '../types/tactical.js'
import { battleCopy } from './battle-presentation.js'
import type { Expedition } from '../types/variants.js'

/** Keep the current objective visible after a pointer preview or blocked click disappears. */
export function tacticalHint(language: Language, run: Expedition): string {
  const encounter = run.encounter
  if (encounter?.kind !== 'matrix' || run.phase !== 'boss')
    return tacticalCopy(language, encounter?.kind).hint

  const matrix = { ...run, encounter }
  if (encounter.health <= matrixHealthFloor(matrix)) return message(language, 'matrix.phase')
  return encounter.exposed
    ? message(language, 'matrix.open-hint')
    : message(language, 'matrix.shield')
}

/** Explain a public action preview without inspecting the mine layout. */
export function tacticalPlanCopy(language: Language, plan: TacticalPlan): string {
  switch (plan.reason) {
    case 'matrix-region':
      return message(language, 'matrix.region-only')
    case 'matrix-ground':
      return message(language, 'matrix.ground')
    case 'matrix-shield':
      return message(language, 'matrix.shield')
    case 'matrix-phase':
      return message(language, 'matrix.phase')
    case 'echo-locate':
      return message(language, 'echo.locate')
    case 'echo-phase':
      return message(language, 'echo.phase-break')
    case 'echo-shell':
      return message(language, 'echo.shell')
    case 'clock-seal':
      return message(language, 'tactical-copy.return-a-spell-with-an-hourglass-to')
    case 'magnet-armor':
      return message(language, 'tactical-copy.lure-the-knight-into-an-anchor-to')
    case 'magnet-route':
      return message(language, 'tactical-copy.open-a-route-of-at-least-two')
    case 'magnet-busy':
      return message(language, 'tactical-copy.anchors-recharge-after-the-lure-and-exposure')
    case 'mirror-seal':
      return message(language, 'tactical-copy.disable-the-seal-in-the-opposite-realm')
    case 'reflection':
      return message(language, 'tactical-copy.reflection-active-shift-and-strike-the-other')
    case 'window':
      return message(language, 'tactical-copy.approach-and-click-the-core-to-prime')
    case 'nests':
      return message(language, 'tactical-copy.deduce-and-destroy-nests-to-weaken-the')
    case 'ready':
      return message(language, 'tactical-copy.cost-ap', { p0: plan.cost })
    case 'points':
      return message(language, 'tactical-copy.needs-ap-shorten-the-route-or-end', { p0: plan.cost })
    case 'armor':
      return message(language, 'tactical-copy.disable-both-shield-pylons-first')
    case 'adjacent':
      return message(language, 'tactical-copy.move-next-to-the-target-first')
    case 'flags':
      return message(language, 'tactical-copy.flag-all-mines-around-the-target-first')
    case 'used':
      return message(language, 'tactical-copy.already-used-or-the-target-is-cleared')
    default:
      return message(language, 'tactical-copy.choose-a-reachable-cell')
  }
}

/** Announce the latest accepted tactical outcome in a compact status line. */
export function tacticalEventCopy(language: Language, encounter: TacticalEncounter): string {
  if (encounter.kind === 'magnetic' && encounter.event === 'braced')
    return message(language, 'tactical-copy.grounded-resist-the-pulse-and-reduce-enemy')
  if (encounter.event === 'braced')
    return message(language, 'tactical-copy.braced-reduce-enemy-damage-by-3-this')
  if (encounter.event === 'misfire')
    return message(language, 'tactical-copy.calibration-failed-5-damage')
  switch (encounter.event) {
    case 'matrix-shifted':
      return message(language, 'matrix.shifted')
    case 'matrix-collected':
      return message(language, 'matrix.collected-event')
    case 'matrix-empty':
      return message(language, 'matrix.empty-event')
    case 'magnet-lured':
      return message(language, 'tactical-copy.lure-locked-clear-the-gold-route')
    case 'magnet-overloaded':
      return message(language, 'tactical-copy.core-overloaded-three-turn-strike-window')
    case 'magnet-grounded':
      return message(language, 'tactical-copy.magnetic-displacement-resisted')
    case 'shifted':
      return message(language, 'tactical-copy.realm-shifted-the-turn-continues')
    case 'twin-fallen':
      return message(language, 'tactical-copy.one-twin-defeated-the-survivor-s-future')
    case 'nest-destroyed':
      return message(language, 'tactical-copy.nest-destroyed-supply-stopped-queen-armor-and')
    case 'echo-shifted':
      return message(language, 'echo.shifted')
    case 'window-opened':
      return message(language, 'tactical-copy.core-primed-strike-window-open')
    case 'disabled':
      return tacticalCopy(language, encounter.kind).disabled
    case 'struck':
      return message(language, 'tactical-copy.strike-landed-damage', { p0: encounter.lastDamage })
    case 'hit':
      return message(language, 'tactical-copy.enemy-attack-hit')
    case 'evaded':
      return message(language, 'tactical-copy.attack-avoided-or-blocked')
    case 'defeated':
      return tacticalCopy(language, encounter.kind).victory
    case 'web-cut':
      return message(language, 'tactical-copy.web-cleared-lane-open')
    case 'egg-crushed':
      return message(language, 'tactical-copy.egg-destroyed-hatching-prevented')
    case 'hatchling-cleared':
      return message(language, 'tactical-copy.hatchling-intercepted-attack-cancelled')
    default:
      if (encounter.kind === 'matrix' && encounter.turn % 3 === 0)
        return message(language, 'matrix.quiet')
      return message(language, 'tactical-copy.battle-in-progress-watch-the-attack-forecast')
  }
}

/** Present the current combat rules for either released boss. */
export function tacticalCopy(
  language: Language,
  kind: EncounterKind = 'bastion',
): TacticalMessages {
  return battleCopy(language, kind)
}
