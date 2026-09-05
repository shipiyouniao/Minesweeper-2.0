import { magneticProjection } from '../game/magnetic-field.js'
import { magneticLandingCopy, magneticStatus } from './magnetic-copy.js'
import { battleText } from './combat-build-copy.js'
import { spriteImage, spriteUrl } from './dungeon-sprites.js'
import { professionSprite } from './profession-presentation.js'
import { tacticalControlsTemplate } from './tactical-template.js'
import type { Expedition } from '../types/variants.js'
import type { MagneticExpedition } from '../types/magnetic.js'
import type { Language } from '../types/localization.js'

/** Keep end-turn controls and a compact visual phase key directly above this arena. */
export function magneticPlaybar(language: Language, run: Expedition): string {
  if (run.encounter?.kind !== 'magnetic' || run.phase !== 'boss') return ''
  const forecast = run.encounter.forecast
  const symbol =
    forecast.kind === 'charge'
      ? '↝'
      : forecast.kind === 'recovery'
        ? '◇'
        : forecast.polarity === 'pull'
          ? '→│←'
          : '←│→'
  return `<div class="magnetic-playbar">${tacticalControlsTemplate(language, run)}<div class="magnetic-key" data-polarity="${forecast.kind === 'field' ? forecast.polarity : forecast.kind}"><span class="magnetic-symbol ${forecast.kind === 'field' && forecast.axis === 'vertical' ? 'vertical' : ''}" aria-hidden="true">${symbol}</span><strong>${magneticStatus(language, run.encounter)}</strong></div></div>`
}

/** Decorate advertised anchors without leaking their covered clue numbers. */
export function markMagneticCell(
  language: Language,
  run: Expedition,
  cell: HTMLElement,
  index: number,
): void {
  const encounter = run.encounter
  if (encounter?.kind !== 'magnetic') return
  if (index === encounter.boss) {
    cell.classList.add('magnetic-boss')
    cell.classList.toggle('magnetic-exposed', encounter.exposedUntil >= encounter.turn)
    cell.classList.toggle('magnetic-defeated', encounter.health === 0)
    cell.insertAdjacentHTML(
      'beforeend',
      '<span class="magnetic-core-ring" aria-hidden="true"></span>',
    )
    return
  }
  const anchor = encounter.anchors.find((entry) => entry.index === index)
  if (!anchor) return
  const revealed = run.game.cells[index]?.visibility === 'revealed'
  cell.classList.add('landmark-cell', 'magnetic-anchor')
  cell.classList.toggle('magnetic-calibrated', anchor.calibrated)
  cell.innerHTML = `${spriteImage('magnetic-anchor')}${revealed ? `<span class="landmark-clue">${run.game.cells[index]?.adjacent ?? 0}</span>` : ''}`
  const label = anchor.calibrated
    ? battleText(
        language,
        'Calibrated anchor · enter to ground, click again to lure',
        '已校准锚点 · 移入稳固，再点牵引',
        '調整済みの錨 · 乗って固定、再クリックで誘導',
      )
    : battleText(
        language,
        'Anchor · reveal and flag surrounding mines',
        '锚点 · 揭开并标出周围地雷',
        '錨 · 開き周囲の地雷をマーク',
      )
  cell.setAttribute('aria-label', `${cell.getAttribute('aria-label')}, ${label}`)
}

/** Own one board's forecast layer and cancellable magnetic performance; never dispatch game actions. */
export class MagneticBoard {
  private readonly root: HTMLElement
  private readonly language: Language
  private run: MagneticExpedition | null = null
  private observer: ResizeObserver | null = null
  private animations: Animation[] = []
  private generation = 0
  private landing: HTMLElement | null = null
  private landingTitle: string | null = null
  private landingDescription: string | null = null

  /** Share the mounted view's lifetime while keeping effects out of the pure battle engine. */
  constructor(root: HTMLElement, language: Language) {
    this.root = root
    this.language = language
  }

  /** Replace the forecast after accepted actions and recompute geometry when the board resizes. */
  render(run: Expedition | null): void {
    this.cancel()
    this.restoreLanding()
    this.observer?.disconnect()
    this.run =
      run?.encounter?.kind === 'magnetic' && run.phase === 'boss'
        ? { ...run, encounter: run.encounter }
        : null
    if (!this.run) return
    this.draw()
    const grid = this.grid()
    if (!grid) return
    this.observer = new ResizeObserver(() => {
      if (this.animations.length) this.cancel()
      this.draw()
    })
    this.observer.observe(grid)
  }

  /** Find only this view's interactive grid, avoiding comparison and camp surfaces. */
  private grid(): HTMLElement | null {
    return this.root.querySelector<HTMLElement>('[data-side="a"]')
  }

  /** Convert a public grid coordinate to its current measured cell element. */
  private cell(index: number): HTMLElement | null {
    return this.grid()?.querySelector<HTMLElement>(`[data-cell="${index}"]`) ?? null
  }

  /** Draw directional field marks, a concrete destination ghost and a route above the cell layer. */
  private draw(): void {
    const run = this.run
    const grid = this.grid()
    if (!run || !grid) return
    this.restoreLanding()
    grid.querySelector('.magnetic-overlay')?.remove()
    for (const mark of grid.querySelectorAll('.magnetic-arrow')) mark.remove()
    for (const cell of grid.querySelectorAll('.magnetic-landing, .magnetic-grounded'))
      cell.classList.remove('magnetic-landing', 'magnetic-grounded')
    const forecast = run.encounter.forecast
    grid.dataset['magnetic'] = forecast.kind === 'field' ? forecast.polarity : forecast.kind
    const projection = magneticProjection(run)
    const rotation = { left: '180deg', right: '0deg', up: '-90deg', down: '90deg', none: '0deg' }
    if (forecast.kind === 'field') {
      for (const cell of grid.querySelectorAll<HTMLElement>('[data-cell]')) {
        const index = Number(cell.dataset['cell'])
        if (run.walls.includes(index)) continue
        const vector = magneticProjection(run, index)
        if (vector.direction === 'none') continue
        cell.insertAdjacentHTML(
          'beforeend',
          `<span class="magnetic-arrow" style="--magnetic-angle:${rotation[vector.direction]}" aria-hidden="true">›</span>`,
        )
      }
    }
    const path = forecast.kind === 'charge' ? forecast.path : projection.path
    const points = path
      .flatMap((index) => {
        const cell = this.cell(index)
        return cell
          ? [`${cell.offsetLeft + cell.offsetWidth / 2},${cell.offsetTop + cell.offsetHeight / 2}`]
          : []
      })
      .join(' ')
    const target = this.cell(path.at(-1) ?? run.player)
    const overlay = document.createElement('div')
    overlay.className = `magnetic-overlay ${forecast.kind === 'charge' ? 'magnetic-charge' : projection.landing === 'known' ? '' : 'magnetic-uncertain'}`
    overlay.setAttribute('aria-hidden', 'true')
    overlay.innerHTML = `<svg class="magnetic-lines" width="100%" height="100%" viewBox="0 0 ${grid.offsetWidth} ${grid.offsetHeight}"><defs><marker id="magnetic-arrowhead" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto"><path d="M0,0 L6,3.5 L0,7" fill="none" stroke="currentColor" stroke-width="1.4" /></marker></defs>${path.length > 1 ? `<polyline class="magnetic-trail-halo" points="${points}" /><polyline class="magnetic-trail" points="${points}" marker-end="url(#magnetic-arrowhead)" />` : ''}</svg>`
    if (target && path.length > 1) {
      const ghost = document.createElement('div')
      ghost.className = 'magnetic-ghost'
      ghost.style.cssText = `left:${target.offsetLeft}px;top:${target.offsetTop}px;width:${target.offsetWidth}px;height:${target.offsetHeight}px`
      ghost.innerHTML = spriteImage(
        forecast.kind === 'charge' ? 'magnetic-knight' : professionSprite(run.departure.profession),
      )
      overlay.append(ghost)
      target.classList.add('magnetic-landing')
      this.landing = target
      this.landingTitle = target.getAttribute('title')
      this.landingDescription = target.getAttribute('aria-description')
      const label =
        forecast.kind === 'charge'
          ? magneticStatus(this.language, run.encounter)
          : magneticLandingCopy(this.language, projection)
      target.setAttribute('aria-description', label)
      target.title = label
    }
    if (forecast.kind === 'field' && projection.anchored)
      this.cell(run.player)?.classList.add('magnetic-grounded')
    grid.append(overlay)
  }

  /** Restore underlying cell hints before moving or removing the owned projection annotation. */
  private restoreLanding(): void {
    const cell = this.landing
    if (!cell) return
    if (this.landingTitle === null) cell.removeAttribute('title')
    else cell.setAttribute('title', this.landingTitle)
    if (this.landingDescription === null) cell.removeAttribute('aria-description')
    else cell.setAttribute('aria-description', this.landingDescription)
    cell.classList.remove('magnetic-landing')
    this.landing = null
    this.landingTitle = null
    this.landingDescription = null
  }

  /** Move a temporary actor along the resolved path while retaining all original click targets. */
  private animateActor(
    path: readonly number[],
    sprite: string,
    duration: number,
  ): Animation | null {
    const grid = this.grid()
    const first = this.cell(path[0] ?? -1)
    if (!grid || !first || path.length < 2) return null
    const actor = document.createElement('img')
    actor.src = sprite
    actor.className = 'magnetic-actor'
    actor.alt = ''
    actor.style.width = `${first.offsetWidth}px`
    actor.style.height = `${first.offsetHeight}px`
    grid.append(actor)
    const frames: Keyframe[] = path.flatMap((index) => {
      const cell = this.cell(index)
      return cell ? [{ transform: `translate(${cell.offsetLeft}px, ${cell.offsetTop}px)` }] : []
    })
    const animation = actor.animate(frames, { duration, fill: 'forwards', easing: 'linear' })
    this.animations.push(animation)
    return animation
  }

  /** Play a short buildup, the actual physical motion, and an impact ring without changing the clock. */
  async perform(before: Expedition, after: Expedition): Promise<void> {
    const encounter = after.encounter
    const grid = this.grid()
    if (
      before.encounter?.kind !== 'magnetic' ||
      encounter?.kind !== 'magnetic' ||
      !encounter.resolution ||
      !grid
    )
      return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    this.cancel()
    const generation = this.generation
    const resolution = encounter.resolution
    const field = before.encounter.forecast
    if (field.kind === 'recovery' && resolution.outcome === 'recovered') return
    grid.classList.add('magnetic-performing')
    grid.dataset['performance'] = 'gather'
    const buildup = grid.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(1.09)' }], {
      duration: 260,
      easing: 'ease-in',
      fill: 'forwards',
    })
    this.animations.push(buildup)
    try {
      await buildup.finished
      if (generation !== this.generation) return
      grid.dataset['performance'] = 'move'
      const motions: Animation[] = []
      if (resolution.playerPath.length > 1) {
        grid.classList.add('magnetic-player-moving')
        const motion = this.animateActor(
          resolution.playerPath,
          spriteUrl(professionSprite(before.departure.profession)),
          420,
        )
        if (motion) motions.push(motion)
      }
      if (resolution.bossPath.length > 1) {
        grid.classList.add('magnetic-knight-moving')
        const motion = this.animateActor(
          resolution.bossPath,
          spriteUrl('magnetic-knight'),
          Math.min(1050, 220 + resolution.bossPath.length * 55),
        )
        if (motion) motions.push(motion)
      }
      await Promise.all(motions.map((animation) => animation.finished))
      if (generation !== this.generation) return
      grid.dataset['performance'] = 'impact'
      const impact = this.cell(resolution.impact ?? resolution.playerPath.at(-1) ?? before.player)
      if (impact) {
        const ring = document.createElement('div')
        ring.className = `magnetic-impact ${resolution.outcome === 'overloaded' ? 'magnetic-overload' : ''}`
        ring.style.cssText = `left:${impact.offsetLeft}px;top:${impact.offsetTop}px;width:${impact.offsetWidth}px;height:${impact.offsetHeight}px`
        grid.append(ring)
        const animation = ring.animate(
          [
            { transform: 'scale(.45)', opacity: 1 },
            { transform: 'scale(2.2)', opacity: 0 },
          ],
          { duration: 420, easing: 'ease-out' },
        )
        this.animations.push(animation)
        await animation.finished
      }
    } catch {
      // Pausing, resizing or unmounting cancels presentation after the journal is already committed.
    } finally {
      if (generation === this.generation) this.cancel()
    }
  }

  /** Remove every transient actor and animation, including a cancelled Web Animation's fill state. */
  cancel(): void {
    this.generation++
    for (const animation of this.animations) animation.cancel()
    this.animations = []
    const grid = this.grid()
    grid?.classList.remove(
      'magnetic-performing',
      'magnetic-player-moving',
      'magnetic-knight-moving',
    )
    if (grid) delete grid.dataset['performance']
    for (const actor of this.root.querySelectorAll('.magnetic-actor, .magnetic-impact'))
      actor.remove()
  }

  /** Release geometry and animation resources with the owning view. */
  dispose(): void {
    this.cancel()
    this.restoreLanding()
    this.observer?.disconnect()
    this.run = null
  }
}
