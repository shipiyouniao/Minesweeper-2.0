/** Own the unscaled label bubble independently of geographic navigation and gesture state. */
export class AtlasTooltip {
  private viewport: HTMLElement | null = null

  /** A rerender releases the old bubble before binding to the replacement viewport. */
  mount(viewport: HTMLElement | null): void {
    this.hide()
    this.viewport = viewport
  }

  /** Remove transient labels; no map state or game action is affected. */
  hide(): void {
    this.viewport?.querySelector('.atlas-map-tip')?.remove()
  }

  /** Place labels in screen space so zoom never enlarges their text or covers the controls. */
  show(marker: HTMLElement): void {
    const viewport = this.viewport
    if (!viewport || marker.matches(':disabled')) return

    this.hide()

    const tip = document.createElement('div')

    tip.className = 'atlas-map-tip'
    tip.setAttribute('role', 'status')

    const label = document.createElement('strong')

    label.textContent = marker.dataset['mapName'] ?? ''
    tip.append(label)

    if (marker.dataset['storyAction']) {
      const action = document.createElement('button')

      action.textContent = viewport.dataset['enterLabel'] ?? '→'
      action.dataset['storyAction'] = marker.dataset['storyAction']
      if (marker.dataset['level']) action.dataset['level'] = marker.dataset['level']

      if (marker.dataset['scene']) action.dataset['scene'] = marker.dataset['scene']

      tip.append(action)
    }

    viewport.append(tip)

    const bounds = viewport.getBoundingClientRect()
    const target = marker.getBoundingClientRect()

    tip.style.left = `${Math.max(8, Math.min(viewport.clientWidth - tip.offsetWidth - 8, target.x - bounds.x + target.width / 2 - tip.offsetWidth / 2))}px`
    tip.style.top = `${Math.max(8, Math.min(viewport.clientHeight - tip.offsetHeight - 8, target.y - bounds.y - tip.offsetHeight - 8))}px`
  }
}
