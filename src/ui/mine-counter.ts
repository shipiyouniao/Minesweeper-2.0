import { message } from '../i18n.js'
import { icon } from '../icons.js'
import type { Game } from '../types/game.js'
import type { Language } from '../types/localization.js'
import type { BoardSide } from '../types/variants.js'

/** Count visible flags against the public quota, without checking whether guesses are correct. */
export function remainingMines(game: Game): number {
  return game.config.mines - game.cells.filter((cell) => cell.visibility === 'flagged').length
}

/** Keep each board's counter outside its scrolling grid and announce changed values together. */
export function mineCounterTemplate(
  language: Language,
  game: Game,
  side: BoardSide | null = null,
): string {
  return `<span class="mine-counter tw:inline-flex tw:shrink-0 tw:items-center tw:gap-1.5 tw:whitespace-nowrap tw:text-[clamp(12px,0.8vw,16px)] tw:text-muted tw:[&_.icon]:w-[1em] tw:[&_.icon]:h-[1em]" role="status" aria-atomic="true">${side ? `<span class="tw:sr-only">${side.toUpperCase()} · </span>` : ''}${icon('flag')}<span>${message(language, 'board.remaining-mines')}</span> <strong class="tw:text-ink tw:[font-family:var(--mono)] tw:tabular-nums tw:min-w-[3ch] tw:text-right" data-mine-count>${remainingMines(game)}</strong></span>`
}
