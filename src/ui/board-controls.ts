import { message, translations } from '../i18n.js'
import { icon } from '../icons.js'
import type { BoardControlAttribute, BoardControlsCopy } from '../types/board-controls.js'
import type { Language } from '../types/localization.js'
import type { BoardInputMode } from '../types/ui.js'

/** Keep pointer instructions independent of keyboard shortcuts and complete in all locales. */
function controlsCopy(language: Language): BoardControlsCopy {
  return {
    label: message(language, 'board-controls.label'),
    reveal: message(language, 'board-controls.reveal'),
    flag: message(language, 'board-controls.flag'),
    safe: message(language, 'board-controls.safe'),
    chord: message(language, 'board-controls.chord'),
    gestures: message(language, 'board-controls.gestures'),
  }
}

/** Explain what the next ordinary click or tap will do, rather than an invisible focus position. */
export function boardControlHint(language: Language, mode: BoardInputMode): string {
  const copy = controlsCopy(language)
  return mode === 'reveal'
    ? copy.reveal
    : mode === 'flag'
      ? copy.flag
      : mode === 'mark-safe'
        ? copy.safe
        : copy.chord
}

/** Cycle one visible control while retaining mouse shortcuts and direct keyboard commands. */
export function nextBoardMode(mode: BoardInputMode): BoardInputMode {
  return mode === 'reveal'
    ? 'flag'
    : mode === 'flag'
      ? 'mark-safe'
      : mode === 'mark-safe'
        ? 'chord'
        : 'reveal'
}

/** Render the shared pointer and touch mode switch with its current accessible label. */
export function boardControlsTemplate(
  language: Language,
  mode: BoardInputMode,
  attribute: BoardControlAttribute,
): string {
  const t = translations[language]
  const label =
    mode === 'reveal'
      ? t.reveal
      : mode === 'flag'
        ? t.flag
        : mode === 'mark-safe'
          ? t.markSafe
          : t.quickReveal
  const cycle = message(language, 'board-controls.tap-to-cycle')
  return `<button class="dock-slot mode-cycle" ${attribute}="cycle-mode" data-mode="${mode}" aria-label="${label} · ${cycle}" title="${boardControlHint(language, mode)}">${icon(mode === 'flag' ? 'flag' : mode === 'mark-safe' ? 'check' : 'pointer')}<strong>${label}</strong><small>${cycle} ↻</small></button>`
}
