import { escapeHtml } from './presentation.js'
import { sharedStyles } from './shared-styles.js'

/** Share the magnifier, size and accessible label across modes without owning their zoom state. */
export function boardZoomTemplate(label: string): string {
  const text = escapeHtml(label)
  const lens =
    '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6"/></svg>'
  return `<div class="board-zoom ${sharedStyles['board-zoom']}"><button class="zoom-icon" data-control="zoom" aria-label="${text}" title="${text}" aria-pressed="false">${lens}<span aria-hidden="true">+</span></button></div>`
}
