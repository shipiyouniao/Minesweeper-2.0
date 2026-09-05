import { oppositeMirror } from '../game/mirror-state.js'
import { mirrorName } from './mirror-copy.js'
import { battleText } from './combat-build-copy.js'
import { spriteImage } from './dungeon-sprites.js'
import type { Expedition } from '../types/variants.js'
import type { Language } from '../types/localization.js'

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
    ? battleText(language, 'Explore here', '当前镜域', '探索中')
    : battleText(language, 'Compare · shift to play', '对照 · 切换后操作', '比較 · 転移して操作')
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
    ? battleText(
        language,
        'Seal · protects the opposite twin',
        '封印 · 保护另一侧的双子',
        '封印 · 反対側の双子を防護',
      )
    : battleText(language, 'Seal disabled', '封印已关闭', '封印停止')
  const revealed = run.game.cells[index]?.visibility === 'revealed'
  cell.innerHTML = `${spriteImage('mirror-seal')}${revealed ? `<span class="landmark-clue">${run.game.cells[index]?.adjacent ?? 0}</span>` : ''}`
  cell.setAttribute('aria-label', `${cell.getAttribute('aria-label')}, ${label}`)
  cell.title = label
}
