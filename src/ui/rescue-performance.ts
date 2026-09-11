import type { Expedition } from '../types/variants.js'

/** A committed lifeline pulls the pawn along the visible corridor without changing game state. */
export function animateRescue(
  root: HTMLElement,
  before: Expedition | null,
  after: Expedition | null,
): void {
  if (
    !before ||
    !after ||
    before.departure.profession !== 'rescuer' ||
    before.skillUsed ||
    !after.skillUsed ||
    before.floor !== after.floor ||
    before.player === after.player ||
    matchMedia('(prefers-reduced-motion: reduce)').matches
  )
    return

  const from = root.querySelector<HTMLElement>(`[data-side="a"] [data-cell="${before.player}"]`)
  const to = root.querySelector<HTMLElement>(`[data-side="a"] [data-cell="${after.player}"]`)
  const pawn = root.querySelector<HTMLElement>('[data-side="a"] .dungeon-player')
  if (!from || !to || !pawn) return

  const start = from.getBoundingClientRect()
  const end = to.getBoundingClientRect()
  const dx = start.x - end.x
  const dy = start.y - end.y
  const rope = document.createElement('span')

  rope.className = 'rescue-rope'
  rope.style.width = `${Math.hypot(dx, dy)}px`
  rope.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`
  to.append(rope)
  to.classList.add('rescue-moving')

  const motion = pawn.animate(
    [
      { transform: `translate(${from.offsetLeft}px, ${from.offsetTop}px)` },
      { transform: `translate(${to.offsetLeft}px, ${to.offsetTop}px)` },
    ],
    { duration: 520, easing: 'cubic-bezier(.3,0,.2,1)' },
  )

  void motion.finished
    .catch(() => {})
    .finally(() => {
      rope.remove()
      to.classList.remove('rescue-moving')
    })
}
