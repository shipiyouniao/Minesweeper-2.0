import type { SceneTransitionKind } from '../types/scene-transition.js'

/** Own one incoming-scene animation; accepted gameplay and persistence stay with the caller. */
export class SceneTransition {
  private animation: Animation | null = null

  /** Replacing a scene cancels its old effect, including while the player changes routes quickly. */
  async arrive(element: HTMLElement | null, kind: SceneTransitionKind = 'scene'): Promise<void> {
    this.cancel()
    if (!element || matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const frames: Keyframe[] =
      kind === 'map'
        ? [{ opacity: 0.35 }, { opacity: 1 }]
        : [
            { opacity: 0.25, transform: 'translateY(12px)' },
            { opacity: 1, transform: 'translateY(0)' },
          ]
    const animation = element.animate(frames, {
      duration: kind === 'map' ? 180 : 420,
      easing: 'ease-out',
    })

    this.animation = animation
    try {
      await animation.finished
    } catch {
      /* Leaving the scene cancels presentation, not the already committed action. */
    } finally {
      if (this.animation === animation) this.animation = null
    }
  }

  /** Release the browser animation before its owner disposes or replaces the DOM. */
  cancel(): void {
    this.animation?.cancel()
    this.animation = null
  }
}
