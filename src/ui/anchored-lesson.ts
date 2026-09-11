import type { LessonSurface } from '../types/anchored-lesson.js'

/** Mount an in-scene guide and keep it inside the visible board while its target scrolls. */
export function mountAnchoredLesson(
  root: HTMLElement,
  panel: HTMLElement,
  selector: string,
  surface?: LessonSurface,
): () => void {
  const frame = surface?.frame ?? root.querySelector<HTMLElement>('.variant-board-panel')
  const viewport = surface?.viewport ?? frame?.querySelector<HTMLElement>('.board-viewport')
  const dock = surface ? surface.dock : root.querySelector<HTMLElement>('.action-dock')
  if (!frame || !viewport) return () => {}

  const target = root.querySelector<HTMLElement>(selector)

  target?.classList.add('campaign-lesson-target')
  frame.classList.add('campaign-guide-frame')
  frame.append(panel)

  /** Recompute both viewport clipping and the target's current position after layout changes. */

  const position = (): void => {
    const bounds = frame.getBoundingClientRect()
    const board = viewport.getBoundingClientRect()
    const visibleBottom = Math.min(innerHeight, dock?.getBoundingClientRect().top ?? innerHeight)
    // The guide belongs to the board: scrolling to the sidebar must not pin it over other content.
    if (Math.min(board.bottom, visibleBottom) - Math.max(board.top, 0) < 96) {
      panel.hidden = true
      return
    }

    panel.hidden = false

    const tile = target?.getBoundingClientRect()
    const leftEdge = Math.max(board.left, 0) - bounds.left + 8
    const rightEdge = Math.min(board.right, innerWidth) - bounds.left - 8
    const topEdge = Math.max(board.top, 0) - bounds.top + 8
    const bottomEdge = Math.min(board.bottom, visibleBottom) - bounds.top - 8

    // Measure the unbounded card first; scrolling a fitting card would clip its arrow.
    const availableHeight = Math.max(80, bottomEdge - topEdge)

    panel.style.maxHeight = ''
    const needsScroll = panel.offsetHeight > availableHeight

    panel.style.maxHeight = `${availableHeight}px`
    panel.style.overflowY = needsScroll ? 'auto' : 'visible'

    const width = panel.offsetWidth
    const height = panel.offsetHeight
    const visible =
      tile &&
      tile.bottom > board.top &&
      tile.top < board.bottom &&
      tile.right > board.left &&
      tile.left < board.right
    const x = visible ? tile.left + tile.width / 2 - bounds.left : (leftEdge + rightEdge) / 2
    const left = Math.max(leftEdge, Math.min(x - width / 2, rightEdge - width))
    let top = Math.max(topEdge, bottomEdge - height)

    panel.removeAttribute('data-arrow')
    if (visible) {
      const below = tile.bottom - bounds.top + 14
      const above = tile.top - bounds.top - height - 14

      top = below + height <= bottomEdge ? below : Math.max(topEdge, above)
      panel.dataset['arrow'] = top >= tile.bottom - bounds.top ? 'up' : 'down'
      panel.style.setProperty('--guide-arrow', `${Math.max(18, Math.min(width - 18, x - left))}px`)
    }

    panel.style.left = `${left}px`
    panel.style.top = `${top}px`
  }
  const observer = new ResizeObserver(position)

  observer.observe(frame)
  observer.observe(panel)
  window.addEventListener('scroll', position, true)
  window.addEventListener('resize', position)
  position()

  return () => {
    observer.disconnect()
    window.removeEventListener('scroll', position, true)
    window.removeEventListener('resize', position)
    target?.classList.remove('campaign-lesson-target')
    frame.classList.remove('campaign-guide-frame')
    panel.remove()
  }
}
