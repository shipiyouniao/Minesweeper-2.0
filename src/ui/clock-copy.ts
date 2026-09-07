import { message } from '../i18n.js'

import type { ClockEncounter, ClockSpell } from '../types/clock.js'
import type { Language } from '../types/localization.js'
import type { TacticalMessages } from '../types/tactical-ui.js'

/** Absolute deadlines are described relative to the next explicit end-turn, never wall-clock time. */
export function clockDeadline(language: Language, remaining: number): string {
  return remaining === 1
    ? message(language, 'clock-copy.this-turn-end')
    : message(language, 'clock-copy.in-turn-ends', { p0: remaining })
}

/** Describe a frozen spell footprint and its deadline relative to the current turn. */
export function clockSpellCopy(language: Language, spell: ClockSpell, turn: number): string {
  const name = spell.redirected
    ? message(language, 'clock-copy.returned-spell-boss-damage-6')
    : spell.shape === 'cross'
      ? message(language, 'clock-copy.time-mark-damage-3')
      : message(language, 'clock-copy.clock-hand-damage-3')
  return `#${spell.id} · ${name} · ${clockDeadline(language, spell.resolvesOn - turn + 1)}`
}

/** Summarize remaining hourglasses and the active casting or recovery phase. */
export function clockStatus(language: Language, encounter: ClockEncounter): string {
  const count = encounter.hourglasses.filter((glass) => !glass.used).length
  const phase = !encounter.hourglasses.some((glass) => glass.used)
    ? message(language, 'clock-copy.barrier-return-a-spell-first')
    : encounter.recoveryUntil >= encounter.turn
      ? message(language, 'clock-copy.recovery-no-new-spell')
      : encounter.health <= encounter.maxHealth / 2
        ? message(language, 'clock-copy.dual-countdown')
        : message(language, 'clock-copy.delayed-casting')
  return `${phase} · ${message(language, 'clock-copy.hourglasses-3', { p0: count })}`
}

/** Supply localized Clock Mage controls and rules through the shared tactical contract. */
export function clockCopy(language: Language, base: TacticalMessages): TacticalMessages {
  const hint = message(language, 'clock-copy.return-a-spell-with-an-hourglass-to')
  return {
    ...base,
    name: message(language, 'clock-copy.clock-mage-clepsydra'),
    hint,
    disabled: message(language, 'clock-copy.spell-returned-deadline-unchanged'),
    help: [
      base.help[0]!,
      hint,
      message(language, 'clock-copy.marks-deal-3-damage-after-two-turn'),
      message(language, 'clock-copy.each-turn-starts-with-a-walkable-echo'),
      message(language, 'clock-copy.an-adjacent-or-occupied-revealed-hourglass-returns'),
    ],
  }
}
