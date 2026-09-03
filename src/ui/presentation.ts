import type { CellContent, NavigationKey } from '../types/ui.js'
import type { Cell, Config, Game } from '../types/game.js'
import type { Messages } from '../types/localization.js'
import { icon } from '../icons.js'

/** Escape text at the HTML boundary, including persisted player-controlled names. */
export function escapeHtml(value: string): string {
  // Escape ampersands first so the entities introduced below are not escaped twice.
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

/** Format elapsed milliseconds, adding hours and optional tenths when needed. */
export function formatTime(milliseconds: number, precise = false): string {
  const seconds = Math.floor(milliseconds / 1000)
  const parts = [Math.floor(seconds / 60) % 60, seconds % 60].map((part) =>
    String(part).padStart(2, '0'),
  )

  if (seconds >= 3600) {
    parts.unshift(String(Math.floor(seconds / 3600)))
  }

  const tenths = precise ? `.${Math.floor((milliseconds % 1000) / 100)}` : ''

  return parts.join(':') + tenths
}

/** Describe only information the player is allowed to see at this game phase. */
export function cellContent(cell: Cell, ended: boolean, messages: Messages): CellContent {
  if (ended && !cell.mine && cell.visibility === 'flagged') {
    return { html: icon('close'), label: messages.wrongFlag }
  }

  if (cell.visibility === 'flagged') {
    return { html: icon('flag'), label: messages.flagged }
  }

  if (ended && cell.mine) {
    return { html: icon('mine'), label: messages.mine }
  }

  if (cell.visibility === 'revealed') {
    return {
      html: cell.adjacent ? String(cell.adjacent) : '',
      label: cell.adjacent ? `${messages.around} ${cell.adjacent}` : messages.empty,
    }
  }

  // Covered cells must not disclose their clue or mine through HTML or ARIA text.
  return { html: '', label: messages.closed }
}

/** Select the localized status without coupling the renderer to session mutations. */
export function statusText(game: Game, paused: boolean, messages: Messages): string {
  return paused ? messages.paused : messages[game.phase]
}

/** Move an already decoded navigation command within board boundaries. */
export function moveFocus(config: Config, index: number, key: NavigationKey): number {
  const { width, height } = config
  const column = index % width

  switch (key) {
    case 'arrowleft':
      return column > 0 ? index - 1 : index
    case 'arrowright':
      return column < width - 1 ? index + 1 : index
    case 'arrowup':
      return Math.max(column, index - width)
    case 'arrowdown':
      return Math.min((height - 1) * width + column, index + width)
    case 'home':
      return index - column
    case 'end':
      return index - column + width - 1
  }
}
