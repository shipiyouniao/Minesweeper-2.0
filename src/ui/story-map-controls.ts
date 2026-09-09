/** A map camera is presentation-only: zooming, panning and labels never dispatch board actions. */
export class StoryMapControls {
  private events = new AbortController()
  private key = ''
  private zoom = 1
  private x = 0
  private y = 0
  private viewport: HTMLElement | null = null
  private root: HTMLElement | null = null
  private pointer: number | null = null
  private startX = 0
  private startY = 0
  private lastX = 0
  private lastY = 0
  private dragged = false
  private suppressUntil = 0
  private touch = false
  private touchUntil = 0
  private tipArmed = false

  /** Preserve the camera across legend renders, and reset it when changing maps. */
  mount(root: HTMLElement): void {
    this.events.abort()
    this.events = new AbortController()
    this.pointer = null
    this.root = root
    this.viewport = root.querySelector('.atlas-viewport')
    const map = root.querySelector<HTMLElement>('.story-map')
    if (!this.viewport || !map) {
      this.key = ''
      return
    }
    const key = `${map.dataset['mapLevel']}:${map.dataset['mapScene']}`
    if (key !== this.key) {
      this.zoom = 1
      this.x = 0
      this.y = 0
      this.key = key
    }
    const options = { signal: this.events.signal }
    this.viewport.addEventListener('wheel', this.wheel, { ...options, passive: false })
    this.viewport.addEventListener('pointerdown', this.down, options)
    window.addEventListener('pointermove', this.move, options)
    window.addEventListener('pointerup', this.up, options)
    window.addEventListener('pointercancel', this.cancel, options)
    window.addEventListener('blur', this.cancel, options)
    this.viewport.addEventListener('pointerover', this.over, options)
    this.viewport.addEventListener('pointerleave', this.leave, options)
    root.addEventListener('click', this.click, { ...options, capture: true })
    root.addEventListener('keydown', this.keydown, { ...options, capture: true })
    root.querySelector('.atlas-zoom input')?.addEventListener('input', this.input, options)
    window.addEventListener('resize', this.paint, options)
    this.paint()
  }

  dispose(): void {
    this.events.abort()
    this.viewport = null
    this.root = null
  }

  private readonly paint = (): void => {
    const viewport = this.viewport
    const scene = viewport?.querySelector<HTMLElement>('.atlas-scene')
    if (!viewport || !scene) return
    const maxX = (viewport.clientWidth * (this.zoom - 1)) / 2
    const maxY = (viewport.clientHeight * (this.zoom - 1)) / 2
    this.x = Math.max(-maxX, Math.min(maxX, this.x))
    this.y = Math.max(-maxY, Math.min(maxY, this.y))
    scene.style.transform = `translate(${this.x}px, ${this.y}px) scale(${this.zoom})`
    viewport.dataset['zoom'] = String(this.zoom)
    const input = this.root?.querySelector<HTMLInputElement>('.atlas-zoom input')
    if (input) input.value = String(Math.round(this.zoom * 100))
    const output = this.root?.querySelector('output.atlas-zoom-value')
    if (output) output.textContent = `${Math.round(this.zoom * 100)}%`
  }

  private scale(value: number, clientX?: number, clientY?: number): void {
    const next = Math.max(1, Math.min(4, value))
    const rect = this.viewport?.getBoundingClientRect()
    if (rect && clientX !== undefined && clientY !== undefined) {
      const dx = clientX - rect.x - rect.width / 2
      const dy = clientY - rect.y - rect.height / 2
      this.x = dx - ((dx - this.x) * next) / this.zoom
      this.y = dy - ((dy - this.y) * next) / this.zoom
    }
    this.zoom = next
    this.hide()
    this.paint()
  }

  private readonly wheel = (event: WheelEvent): void => {
    event.preventDefault()
    this.scale(
      this.zoom * Math.exp(-Math.max(-200, Math.min(200, event.deltaY)) * 0.002),
      event.clientX,
      event.clientY,
    )
  }
  private readonly input = (event: Event): void => {
    if (event.target instanceof HTMLInputElement) this.scale(Number(event.target.value) / 100)
  }
  private readonly down = (event: PointerEvent): void => {
    this.tipArmed = event.target instanceof Element && !!event.target.closest('.atlas-map-tip')
    if (
      !event.isPrimary ||
      event.button !== 0 ||
      (event.target instanceof Element && event.target.closest('.atlas-map-tip'))
    )
      return
    this.touch = event.pointerType !== 'mouse'
    if (this.touch) this.touchUntil = performance.now() + 1000
    this.pointer = event.pointerId
    this.startX = this.lastX = event.clientX
    this.startY = this.lastY = event.clientY
    this.dragged = false
  }
  private readonly move = (event: PointerEvent): void => {
    if (this.pointer !== event.pointerId) return
    if (Math.hypot(event.clientX - this.startX, event.clientY - this.startY) > 6)
      this.dragged = true
    if (this.dragged) {
      this.viewport?.setPointerCapture(event.pointerId)
      this.x += event.clientX - this.lastX
      this.y += event.clientY - this.lastY
      this.viewport?.classList.add('is-panning')
      this.hide()
      this.paint()
    }
    this.lastX = event.clientX
    this.lastY = event.clientY
  }
  private readonly up = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointer) return
    if (this.dragged) this.suppressUntil = performance.now() + 500
    else if (this.touch && event.target instanceof Element) {
      const marker = event.target.closest<HTMLElement>('[data-map-name]')
      if (marker) this.show(marker)
      else this.hide()
      this.suppressUntil = performance.now() + 700
    }
    this.cancel()
  }
  private readonly cancel = (): void => {
    if (this.pointer !== null && this.viewport?.hasPointerCapture(this.pointer))
      this.viewport.releasePointerCapture(this.pointer)
    this.pointer = null
    this.viewport?.classList.remove('is-panning')
  }
  private readonly over = (event: PointerEvent): void => {
    if (
      event.pointerType !== 'mouse' ||
      performance.now() < this.touchUntil ||
      this.pointer !== null ||
      !(event.target instanceof Element)
    )
      return
    this.touch = false
    const marker = event.target.closest<HTMLElement>('[data-map-name]')
    if (marker) this.show(marker)
    else if (!event.target.closest('.atlas-map-tip')) this.hide()
  }
  private readonly leave = (): void => {
    if (!this.touch) this.hide()
  }
  private readonly click = (event: MouseEvent): void => {
    if (!(event.target instanceof Element)) return
    const zoom = event.target.closest<HTMLElement>('[data-map-zoom]')
    if (zoom) {
      event.stopImmediatePropagation()
      this.scale(
        zoom.dataset['mapZoom'] === 'reset'
          ? 1
          : this.zoom + (zoom.dataset['mapZoom'] === 'in' ? 0.25 : -0.25),
      )
      return
    }
    if (!event.target.closest('.atlas-viewport')) return
    if (event.target.closest('.atlas-map-tip')) {
      if (this.touch && !this.tipArmed) {
        event.preventDefault()
        event.stopImmediatePropagation()
      }
      this.tipArmed = false
      return
    }
    if (performance.now() < this.suppressUntil) {
      event.preventDefault()
      event.stopImmediatePropagation()
      return
    }
    const marker = event.target.closest<HTMLElement>('[data-map-name]')
    if (marker && (this.touch || !marker.dataset['storyAction'])) {
      event.preventDefault()
      event.stopImmediatePropagation()
      this.show(marker)
    } else if (!marker) this.hide()
  }
  private readonly keydown = (event: KeyboardEvent): void => {
    if (!(event.target instanceof HTMLElement) || !event.target.closest('.atlas-viewport')) return
    if (event.key === 'Escape') {
      this.hide()
      return
    }
    const marker = event.target.closest<HTMLElement>('[data-map-name]')
    if (marker && !marker.dataset['storyAction'] && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      event.stopImmediatePropagation()
      this.show(marker)
    }
  }
  private hide(): void {
    this.viewport?.querySelector('.atlas-map-tip')?.remove()
  }

  /** Place the bubble outside the scaled scene so its text stays readable at every zoom level. */
  private show(marker: HTMLElement): void {
    const viewport = this.viewport
    if (!viewport) return
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
