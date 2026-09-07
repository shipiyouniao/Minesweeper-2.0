import { oppositeMirror } from '../game/mirror-state.js'
import { message } from '../i18n.js'
import { mirrorName } from './mirror-copy.js'

import type { Language } from '../types/localization.js'
import type { Expedition } from '../types/variants.js'
import { spriteImage } from './dungeon-sprites.js'

/** Derive a read-only view of the parked room without dispatching a shift or spending AP. */
export function mirrorPreview(run: Expedition): Expedition | null {
  const encounter = run.encounter
  if (encounter?.kind !== 'mirror') return null
  return {
    ...run,
    ...encounter.other,
    encounter: {
      ...encounter,
      active: oppositeMirror(encounter.active),
      intent: encounter.otherIntent,
    },
  }
}

/** Label the active play area and comparison area explicitly, including for screen readers. */
export function mirrorBoardLabel(language: Language, run: Expedition, active: boolean): string {
  const encounter = run.encounter
  if (encounter?.kind !== 'mirror') return ''
  const side = active ? encounter.active : oppositeMirror(encounter.active)
  const purpose = active
    ? message(language, 'mirror-board.explore-here')
    : message(language, 'mirror-board.compare-shift-to-play')
  return `${mirrorName(language, side)} · ${purpose}`
}

/** Keep seals public while hiding their clue until revealed; fallen twins remain inert landmarks. */
export function markMirrorCell(
  language: Language,
  run: Expedition,
  cell: HTMLElement,
  index: number,
): void {
  const encounter = run.encounter
  if (encounter?.kind !== 'mirror') return
  const twin = encounter[encounter.active]
  if (index === encounter.boss) cell.classList.toggle('mirror-fallen', twin.health === 0)
  if (index !== twin.seal.index) return
  cell.classList.add('landmark-cell', 'mirror-seal')
  cell.classList.toggle('mirror-inert', !twin.seal.active)
  const label = twin.seal.active
    ? message(language, 'mirror-board.seal-protects-the-opposite-twin')
    : message(language, 'mirror-board.seal-disabled')
  const revealed = run.game.cells[index]?.visibility === 'revealed'
  cell.innerHTML = `${spriteImage('mirror-seal')}${revealed ? `<span class="landmark-clue">${run.game.cells[index]?.adjacent ?? 0}</span>` : ''}`
  cell.setAttribute('aria-label', `${cell.getAttribute('aria-label')}, ${label}`)
  cell.title = label
}
