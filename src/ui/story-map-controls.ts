import { ATLAS_ZOOM, clampAtlasCamera, zoomAtlas } from './atlas-camera.js'
import { paintAtlasTiles } from './atlas-tiles.js'
import { AtlasTooltip } from './atlas-tooltip.js'
import { SceneTransition } from './scene-transition.js'
import type {
  AtlasCamera,
  AtlasGesture,
  AtlasLevel,
  AtlasPoint,
  AtlasViewport,
} from '../types/atlas.js'

/** Own camera input and listener lifetimes; map gestures never dispatch playable-board actions. */
export class StoryMapControls {
  private events = new AbortController()
  private root: HTMLElement | null = null
  private viewport: HTMLElement | null = null
  private level: AtlasLevel = 'local'
  private key = ''
  private camera: AtlasCamera = { zoom: 1, x: 0, y: 0 }
  private readonly cameras = new Map<string, AtlasCamera>()
  private readonly pointers = new Map<number, AtlasPoint>()
  private gesture: AtlasGesture = { kind: 'idle' }
  private readonly tooltip = new AtlasTooltip()
  private readonly transition = new SceneTransition()
  private suppressUntil = 0
  private touchUntil = 0
  private touch = false
  private tipArmed = false

  /** Restore each chart's camera when returning from a place; legend changes retain the same view. */
  mount(root: HTMLElement): void {
    this.transition.cancel()
    const previousKey = this.key
    if (this.key) this.cameras.set(this.key, this.camera)

    this.cancel()
    this.events.abort()
    this.events = new AbortController()
    this.root = root
    this.viewport = root.querySelector('.atlas-viewport')
    this.tooltip.mount(this.viewport)

    const map = root.querySelector<HTMLElement>('.story-map')
    if (!map || !this.viewport) {
      this.key = ''
      return
    }

    const level = map.dataset['mapLevel']

    this.level = level === 'world' ? 'world' : 'local'
    this.key = `${this.level}:${this.level === 'local' ? map.dataset['mapScene'] : ''}`
    if (this.key !== previousKey) {
      this.suppressUntil = 0
      this.touchUntil = 0
      this.tipArmed = false
    }
    this.camera = this.cameras.get(this.key) ?? { zoom: 1, x: 0, y: 0 }

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
    if (this.key !== previousKey) void this.transition.arrive(this.viewport, 'map')
  }

  /** Cancel captured gestures and labels before the host or active game is removed. */
  dispose(): void {
    this.transition.cancel()
    this.cancel()
    this.events.abort()
    this.tooltip.mount(null)
    this.cameras.clear()
    this.viewport = null
    this.root = null
  }

  /** Screen dimensions are sampled at the effect boundary, never read by camera math. */
  private size(): AtlasViewport {
    return { width: this.viewport?.clientWidth ?? 0, height: this.viewport?.clientHeight ?? 0 }
  }

  /** Apply bounded camera values, visible tiles and matching accessible detail layers together. */
  private readonly paint = (): void => {
    const viewport = this.viewport
    const scene = viewport?.querySelector<HTMLElement>('.atlas-scene')
    if (!viewport || !scene) return

    this.camera = clampAtlasCamera(this.camera, this.size())

    const { zoom, x, y } = this.camera

    scene.style.transform = `translate(${x}px, ${y}px) scale(${zoom})`
    viewport.dataset['zoom'] = String(zoom)
    paintAtlasTiles(viewport, this.level, this.camera)

    const input = this.root?.querySelector<HTMLInputElement>('.atlas-zoom input')
    if (input) {
      input.value = String(Math.round(zoom * 100))
      input.style.setProperty(
        '--atlas-zoom-fill',
        `${((zoom - ATLAS_ZOOM.min) / (ATLAS_ZOOM.max - ATLAS_ZOOM.min)) * 100}%`,
      )
      input.setAttribute('aria-valuetext', `${Math.round(zoom * 100)}%`)
    }

    const out = this.root?.querySelector<HTMLButtonElement>('[data-map-zoom="out"]')
    const into = this.root?.querySelector<HTMLButtonElement>('[data-map-zoom="in"]')
    if (out) out.disabled = zoom <= ATLAS_ZOOM.min
    if (into) into.disabled = zoom >= ATLAS_ZOOM.max

    const output = this.root?.querySelector('output.atlas-zoom-value')
    if (output) output.textContent = `${Math.round(zoom * 100)}%`
  }

  /** Zoom around a pointer's position, or the viewport center for buttons and keyboard input. */
  private scale(value: number, point?: AtlasPoint): void {
    const bounds = this.viewport?.getBoundingClientRect()
    const anchor =
      point && bounds
        ? { x: point.x - bounds.x - bounds.width / 2, y: point.y - bounds.y - bounds.height / 2 }
        : { x: 0, y: 0 }

    this.camera = zoomAtlas(this.camera, value, anchor, this.size())
    this.tooltip.hide()
    this.paint()
  }

  /** Wheel zoom stays inside the map and preserves the geographical point beneath the cursor. */
  private readonly wheel = (event: WheelEvent): void => {
    event.preventDefault()
    this.scale(this.camera.zoom * Math.exp(-Math.max(-200, Math.min(200, event.deltaY)) * 0.002), {
      x: event.clientX,
      y: event.clientY,
    })
  }

  /** Range controls use the same zoom bounds and renderer as every other input method. */
  private readonly input = (event: Event): void => {
    if (event.target instanceof HTMLInputElement) this.scale(Number(event.target.value) / 100)
  }

  /** Begin a pan or promote the two tracked touch points to a pinch. */
  private readonly down = (event: PointerEvent): void => {
    if (event.button !== 0 || !(event.target instanceof Element)) return

    // A new gesture is intentional input; only the old gesture's synthesized click is suppressed.
    if (!this.pointers.size) this.suppressUntil = 0

    this.tipArmed = !!event.target.closest('.atlas-map-tip')
    if (this.tipArmed) return

    this.touch = event.pointerType !== 'mouse'
    if (this.touch) this.touchUntil = performance.now() + 1000

    const point = { x: event.clientX, y: event.clientY }

    this.pointers.set(event.pointerId, point)
    if (this.pointers.size === 2) {
      this.gesture = this.pinch()
      this.tooltip.hide()
      this.suppressUntil = performance.now() + 700
    } else if (this.pointers.size === 1)
      this.gesture = {
        kind: 'pan',
        pointer: event.pointerId,
        start: point,
        last: point,
        dragged: false,
      }
  }

  /** Derive a pinch from exactly two active pointers, independent of their arrival order. */
  private pinch(): AtlasGesture {
    const [a, b] = [...this.pointers.values()]
    return a && b
      ? {
          kind: 'pinch',
          distance: Math.max(1, Math.hypot(b.x - a.x, b.y - a.y)),
          midpoint: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        }
      : { kind: 'idle' }
  }

  /** Moving fingers either pan or pinch; click suppression survives the last finger being released. */
  private readonly move = (event: PointerEvent): void => {
    if (!this.pointers.has(event.pointerId)) return

    const point = { x: event.clientX, y: event.clientY }

    this.pointers.set(event.pointerId, point)

    const gesture = this.gesture
    if (gesture.kind === 'pinch') {
      const next = this.pinch()
      if (next.kind !== 'pinch') return

      this.scale((this.camera.zoom * next.distance) / gesture.distance, gesture.midpoint)
      this.camera = {
        ...this.camera,
        x: this.camera.x + next.midpoint.x - gesture.midpoint.x,
        y: this.camera.y + next.midpoint.y - gesture.midpoint.y,
      }
      this.gesture = next
      this.paint()

      return
    }

    if (gesture.kind !== 'pan' || gesture.pointer !== event.pointerId) return

    const dragged =
      gesture.dragged || Math.hypot(point.x - gesture.start.x, point.y - gesture.start.y) > 6
    if (dragged) {
      this.viewport?.setPointerCapture(event.pointerId)
      this.camera = {
        ...this.camera,
        x: this.camera.x + point.x - gesture.last.x,
        y: this.camera.y + point.y - gesture.last.y,
      }
      this.viewport?.classList.add('is-panning')
      this.tooltip.hide()
      this.paint()
    }

    this.gesture = { ...gesture, last: point, dragged }
  }

  /** A local-board tap opens its label; outer-map taps activate visible destinations directly. */
  private readonly up = (event: PointerEvent): void => {
    if (!this.pointers.has(event.pointerId)) return

    if (this.gesture.kind === 'pinch' || this.gesture.kind === 'settling') {
      // Suppress the gesture until its final finger leaves, however long that finger is held.
      if (this.viewport?.hasPointerCapture(event.pointerId))
        this.viewport.releasePointerCapture(event.pointerId)
      this.pointers.delete(event.pointerId)
      this.gesture = { kind: this.pointers.size ? 'settling' : 'idle' }
      this.suppressUntil = performance.now() + 700
      return
    }

    if (this.gesture.kind === 'pan' && this.gesture.dragged)
      this.suppressUntil = performance.now() + 700
    else if (this.touch && this.level === 'local' && event.target instanceof Element) {
      const marker = event.target.closest<HTMLElement>('[data-map-name]')
      if (marker) this.tooltip.show(marker)
      else this.tooltip.hide()

      this.suppressUntil = performance.now() + 700
    }

    this.cancel()
  }

  /** Release every pointer on cancellation so interrupted pinches never leave a stuck camera. */
  private readonly cancel = (): void => {
    for (const pointer of this.pointers.keys()) {
      if (this.viewport?.hasPointerCapture(pointer)) this.viewport.releasePointerCapture(pointer)
    }

    this.pointers.clear()
    this.gesture = { kind: 'idle' }
    this.viewport?.classList.remove('is-panning')
  }

  /** Hover labels remain readable without triggering navigation or changing discovery. */
  private readonly over = (event: PointerEvent): void => {
    if (
      event.pointerType !== 'mouse' ||
      performance.now() < this.touchUntil ||
      this.gesture.kind !== 'idle' ||
      !(event.target instanceof Element)
    )
      return

    this.touch = false

    const marker = event.target.closest<HTMLElement>('[data-map-name]')
    if (marker) this.tooltip.show(marker)
    else if (!event.target.closest('.atlas-map-tip')) this.tooltip.hide()
  }

  /** Touch labels stay available until dismissed; mouse labels leave with the pointer. */
  private readonly leave = (): void => {
    if (!this.touch) this.tooltip.hide()
  }

  /** Route presentation controls before the app receives real destination clicks. */
  private readonly click = (event: MouseEvent): void => {
    if (!(event.target instanceof Element)) return

    const zoom = event.target.closest<HTMLElement>('[data-map-zoom]')
    if (zoom) {
      event.stopImmediatePropagation()
      this.scale(
        zoom.dataset['mapZoom'] === 'reset'
          ? 1
          : this.camera.zoom + (zoom.dataset['mapZoom'] === 'in' ? 0.25 : -0.25),
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

    if (event.detail !== 0 && performance.now() < this.suppressUntil) {
      event.preventDefault()
      event.stopImmediatePropagation()

      return
    }

    const focus = event.target.closest<HTMLElement>('[data-map-focus]')
    if (focus && !focus.matches(':disabled')) {
      event.stopImmediatePropagation()

      const zoom = Number(focus.dataset['mapTargetZoom'])
      const x = Number(focus.dataset['mapX']),
        y = Number(focus.dataset['mapY'])
      if (![zoom, x, y].every(Number.isFinite)) return

      this.camera = clampAtlasCamera(
        {
          zoom: Math.min(ATLAS_ZOOM.max, Math.max(ATLAS_ZOOM.min, zoom)),
          x: (0.5 - x / 100) * this.size().width * zoom,
          y: (0.5 - y / 100) * this.size().height * zoom,
        },
        this.size(),
      )
      this.tooltip.hide()
      this.paint()

      return
    }

    const marker = event.target.closest<HTMLElement>('[data-map-name]')
    if (marker && !marker.dataset['storyAction']) {
      event.preventDefault()
      event.stopImmediatePropagation()
      this.tooltip.show(marker)
    } else if (!marker) this.tooltip.hide()
  }

  /** Keyboard users can zoom and pan the focusable viewport without a pointing device. */
  private readonly keydown = (event: KeyboardEvent): void => {
    if (!(event.target instanceof HTMLElement) || !event.target.closest('.atlas-viewport')) return

    if (event.key === 'Escape') {
      this.tooltip.hide()
      return
    }

    if (event.target === this.viewport) {
      if (event.key === '+' || event.key === '=' || event.key === '-') {
        event.preventDefault()
        event.stopImmediatePropagation()
        this.scale(this.camera.zoom + (event.key === '-' ? -0.25 : 0.25))

        return
      }
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        event.preventDefault()
        event.stopImmediatePropagation()
        this.camera = {
          ...this.camera,
          x:
            this.camera.x + (event.key === 'ArrowLeft' ? 48 : event.key === 'ArrowRight' ? -48 : 0),
          y: this.camera.y + (event.key === 'ArrowUp' ? 48 : event.key === 'ArrowDown' ? -48 : 0),
        }
        this.tooltip.hide()
        this.paint()

        return
      }
    }

    const marker = event.target.closest<HTMLElement>('[data-map-name]')
    if (marker && !marker.dataset['storyAction'] && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      event.stopImmediatePropagation()
      this.tooltip.show(marker)
    }
  }
}
