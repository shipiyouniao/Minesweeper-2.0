/** CSS animation may be disabled by accessibility preferences; cleanup must not depend on it. */
export function removeTransientEffect(layer: HTMLElement): void {
  const delay = matchMedia('(prefers-reduced-motion: reduce)').matches ? 180 : 1600
  const timer = window.setTimeout(cleanup, delay)
  /** Release both completion listeners and the fallback timer exactly once. */
  function cleanup(): void {
    window.clearTimeout(timer)
    layer.removeEventListener('animationend', cleanup)
    layer.removeEventListener('animationcancel', cleanup)
    layer.remove()
  }
  layer.addEventListener('animationend', cleanup, { once: true })
  layer.addEventListener('animationcancel', cleanup, { once: true })
}
