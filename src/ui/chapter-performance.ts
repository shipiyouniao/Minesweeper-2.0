import type { StoryScene } from '../types/story.js'
import type { Language } from '../types/localization.js'
import { message } from '../i18n.js'

/** Lower the actual west-route bridge during the once-only restored-line conversation. */
export function bridgeReveal(language: Language): string {
  return `<figure class="chapter-route-reveal" data-bridge-reveal><svg viewBox="0 0 400 120" role="img" aria-label="${message(language, 'finale.bridge')}"><path d="M210 0 Q180 50 200 120" stroke="#9dbfc0" stroke-width="36" fill="none"/><path d="M30 65 H170 M228 65 H370" stroke="#b8a781" stroke-width="16"/><g class="chapter-lowering-bridge"><path d="M171 65 H230" stroke="#897252" stroke-width="22"/><path d="M178 54 V76 M190 54 V76 M202 54 V76 M214 54 V76 M226 54 V76" stroke="#cbb88c" stroke-width="5"/></g><circle class="chapter-route-light" cx="30" cy="65" r="9"/><circle class="chapter-route-light" cx="365" cy="65" r="9"/></svg><figcaption>${message(language, 'finale.bridge')} → ${message(language, 'finale.pass')}</figcaption></figure>`
}

/** Announce a physical northwest crossing after its checkpoint is already safe on disk. */
export async function animateNorthwestArrival(
  root: HTMLElement,
  scene: StoryScene['id'],
): Promise<void> {
  if (
    (scene !== 'northwest-bridge' && scene !== 'blockade-pass') ||
    matchMedia('(prefers-reduced-motion: reduce)').matches
  )
    return
  const board = root.querySelector<HTMLElement>('.story-board')
  if (!board) return
  const animation = board.animate(
    [
      { opacity: 0.25, transform: 'translateY(12px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
    { duration: 420, easing: 'ease-out' },
  )
  await animation.finished.catch(() => {})
}
