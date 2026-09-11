import { floorObjectiveComplete } from '../game/floor-circuits.js'
import { spriteImage } from './dungeon-sprites.js'
import type { Expedition } from '../types/variants.js'

/** Opening belongs to objective state, independently of whether a route has been cleared yet. */
export function exitIsOpen(run: Expedition): boolean {
  return (!run.encounter || run.encounter.health === 0) && floorObjectiveComplete(run)
}

/** Animate only a closed-to-open transition in this room, never reloads or entering another floor. */
export function animateExitOpening(
  root: HTMLElement,
  before: Expedition | null,
  after: Expedition | null,
): void {
  if (
    !before ||
    !after ||
    before.floor !== after.floor ||
    before.departure !== after.departure ||
    exitIsOpen(before) ||
    !exitIsOpen(after)
  )
    return
  const cell = root.querySelector<HTMLElement>(`[data-side="a"] [data-cell="${after.exit}"]`)
  if (!cell || matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const overlay = document.createElement('span')
  overlay.className = 'exit-opening'
  overlay.setAttribute('aria-hidden', 'true')
  overlay.innerHTML = spriteImage('exit-closed')
  cell.append(overlay)
  // The frame stays aligned while the closed doorway gives way to the original open asset.
  const delay = after.rail ? Math.min(1800, after.rail.travel.length * 140) : 0
  const animation = overlay.animate([{ opacity: 1 }, { opacity: 1, offset: 0.2 }, { opacity: 0 }], {
    duration: 850,
    delay,
    fill: 'backwards',
    easing: 'ease-in-out',
  })
  cell.animate(
    [
      { filter: 'brightness(1)' },
      { filter: 'brightness(1.4)', offset: 0.65 },
      { filter: 'brightness(1)' },
    ],
    { duration: 1000, delay },
  )
  void animation.finished.catch(() => {}).finally(() => overlay.remove())
}
