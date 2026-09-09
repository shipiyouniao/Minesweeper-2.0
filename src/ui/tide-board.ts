import { anchorArea } from '../game/tide-shuffle.js'
import { message } from '../i18n.js'
import { spriteImage } from './dungeon-sprites.js'
import { removeTransientEffect } from './transient-effect.js'
import type { Expedition } from '../types/variants.js'
import type { Language } from '../types/localization.js'

/** Keep the next tide visible above the board when the sidebar stacks below it. */
export function tidePlaybar(language: Language, run: Expedition): string {
  if (run.encounter?.kind !== 'tide' || run.phase !== 'boss') return ''
  const turns = 3 - ((run.encounter.turn - 1) % 3)
  return `<div class="tide-playbar" data-tide-due="${turns === 1}"><span class="tide-clock" aria-hidden="true">${[1, 2, 3].map((step) => `<i class="${step <= turns ? 'lit' : ''}"></i>`).join('')}</span><strong>${message(language, 'tide.until', { turns })}</strong><span>${run.encounter.exposed ? message(language, 'tide.open') : message(language, 'tide.shield')}</span></div>`
}

/** Decorate public landmarks and footprints without disclosing a covered number. */
export function markTideCell(
  language: Language,
  run: Expedition,
  cell: HTMLElement,
  index: number,
): void {
  const e = run.encounter
  if (e?.kind !== 'tide') return
  cell.classList.toggle(
    'tide-fixed',
    e.anchors.some((center) => anchorArea(run.game.config, center).includes(index)),
  )
  if (index === e.boss) cell.classList.add(e.exposed ? 'tide-exposed' : 'tide-shielded')
  if (index === e.core) {
    cell.classList.add('landmark-cell', 'tide-core')
    const clue =
      run.game.cells[index]!.visibility === 'revealed'
        ? `<span class="landmark-clue">${run.game.cells[index]!.adjacent}</span>`
        : ''
    cell.innerHTML = `${spriteImage('tide-core')}${clue}`
    cell.setAttribute(
      'aria-label',
      `${cell.getAttribute('aria-label')}, ${message(language, 'tide.core')}`,
    )
  }
  if (e.anchors.includes(index)) {
    cell.insertAdjacentHTML(
      'beforeend',
      `<span class="tide-anchor-marker" aria-hidden="true">${spriteImage('tide-anchor')}</span>`,
    )
    cell.setAttribute('aria-description', message(language, 'tide.anchored'))
  }
}

/** A successful drop visibly lands, unrolls chains and illuminates its complete footprint. */
export function animateTideAnchor(
  root: HTMLElement,
  before: Expedition | null,
  after: Expedition | null,
): void {
  if (
    before?.encounter?.kind !== 'tide' ||
    after?.encounter?.kind !== 'tide' ||
    before.departure.seed !== after.departure.seed ||
    before.floor !== after.floor ||
    before.encounter.turn !== after.encounter.turn
  )
    return
  const previous = before.encounter
  for (const index of after.encounter.anchors.filter(
    (center) => !previous.anchors.includes(center),
  )) {
    const cell = root.querySelector<HTMLElement>(`[data-side="a"] [data-cell="${index}"]`)
    if (!cell) continue
    const drop = document.createElement('span')
    drop.className = 'tide-anchor-drop'
    drop.setAttribute('aria-hidden', 'true')
    drop.innerHTML = `${spriteImage('tide-anchor')}<i class="tide-chain tide-chain-x"></i><i class="tide-chain tide-chain-y"></i>`
    cell.append(drop)
    removeTransientEffect(drop)
    for (const target of anchorArea(after.game.config, index)) {
      const tile = root.querySelector<HTMLElement>(`[data-side="a"] [data-cell="${target}"]`)
      const glow = document.createElement('span')
      glow.className = 'tide-anchor-glow'
      glow.setAttribute('aria-hidden', 'true')
      tile?.append(glow)
      removeTransientEffect(glow)
    }
  }
}

/** Own interruptible, pre-repaint movement of the existing public tile elements. */
export class TideBoard {
  private readonly root: HTMLElement
  private readonly animations: Animation[] = []
  private readonly layers: HTMLElement[] = []
  private generation = 0

  /** Keep the performance inside one mounted game surface. */
  constructor(root: HTMLElement) {
    this.root = root
  }

  /** Find a cell on the actual board; hidden mine values are never read by the animator. */
  private cell(index: number): HTMLElement | null {
    return this.root.querySelector<HTMLElement>(`[data-side="a"] [data-cell="${index}"]`)
  }

  /** Track every animation so backgrounding or teardown releases the whole performance. */
  private animate(element: HTMLElement, frames: Keyframe[], duration: number): Animation {
    const animation = element.animate(frames, {
      duration,
      easing: 'cubic-bezier(.4,0,.2,1)',
      fill: 'forwards',
    })
    this.animations.push(animation)
    return animation
  }

  /** Mount a decorative layer which cannot intercept mouse or touch input. */
  private layer(parent: HTMLElement, className: string): HTMLElement {
    const layer = document.createElement('span')
    layer.className = className
    layer.setAttribute('aria-hidden', 'true')
    parent.append(layer)
    this.layers.push(layer)
    return layer
  }

  /** Play the frozen strike before the tide, then show the anchored core returning its wave. */
  async perform(before: Expedition, after: Expedition): Promise<void> {
    this.cancel()
    if (before.encounter?.kind !== 'tide' || after.encounter?.kind !== 'tide') return
    const generation = this.generation
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const grid = this.root.querySelector<HTMLElement>('[data-side="a"]')
    const boss = this.cell(before.encounter.boss)
    if (!grid || !boss) return
    grid.classList.add('tide-performing')
    const e = before.encounter

    try {
      const strikes = e.intent.targets.flatMap((index) => {
        const cell = this.cell(index)
        if (!cell) return []
        const layer = this.layer(cell, 'tide-strike')
        return [
          this.animate(
            layer,
            [
              { opacity: 0, transform: 'scale(.3)' },
              { opacity: 0.9, offset: 0.45 },
              { opacity: 0, transform: 'scale(1)' },
            ],
            reduced ? 140 : 360,
          ),
        ]
      })
      const windup = this.animate(
        boss,
        reduced
          ? [{ opacity: 1 }, { opacity: 0.6 }, { opacity: 1 }]
          : [
              { transform: 'none' },
              { transform: 'translateY(-12%) rotate(-8deg)' },
              { transform: 'none' },
            ],
        reduced ? 140 : 360,
      )
      await Promise.all([...strikes, windup].map((animation) => animation.finished))
      if (
        generation !== this.generation ||
        after.phase !== 'boss' ||
        after.encounter.cycle === e.cycle
      )
        return

      const wave = this.layer(grid, 'tide-wave')
      const sweep = this.animate(
        wave,
        reduced
          ? [{ opacity: 0 }, { opacity: 0.3 }, { opacity: 0 }]
          : [
              { backgroundPosition: '50% 0%', opacity: 0 },
              { opacity: 0.65, offset: 0.3 },
              { backgroundPosition: '50% 100%', opacity: 0 },
            ],
        reduced ? 160 : 780,
      )
      const moving = after.encounter.permutation.flatMap((to, from) => {
        if (to === from) return []
        const source = this.cell(from)
        const target = this.cell(to)
        if (!source || !target) return []
        const x = target.offsetLeft - source.offsetLeft
        const y = target.offsetTop - source.offsetTop
        return [
          this.animate(
            source,
            reduced
              ? [{ opacity: 1 }, { opacity: 0.3 }, { opacity: 1 }]
              : [
                  { transform: 'none' },
                  {
                    transform: `translate(${x * 0.5}px, ${y * 0.5 - 8}px) scale(.82)`,
                    offset: 0.5,
                  },
                  { transform: `translate(${x}px, ${y}px)` },
                ],
            reduced ? 160 : 780,
          ),
        ]
      })
      await Promise.all([sweep, ...moving].map((animation) => animation.finished))
      if (generation !== this.generation || !after.encounter.countercurrent) return

      const core = this.cell(e.core)
      if (!core) return
      const beam = this.layer(grid, 'tide-countercurrent')
      const x = core.offsetLeft + core.offsetWidth / 2
      const y = core.offsetTop + core.offsetHeight / 2
      const dx = boss.offsetLeft + boss.offsetWidth / 2 - x
      const dy = boss.offsetTop + boss.offsetHeight / 2 - y
      beam.style.cssText = `left:${x}px;top:${y}px;width:${Math.hypot(dx, dy)}px;rotate:${Math.atan2(dy, dx)}rad`
      await this.animate(
        beam,
        [
          { scale: '0 1', opacity: 0 },
          { scale: '1 1', opacity: 1, offset: 0.65 },
          { scale: '1 2', opacity: 0 },
        ],
        reduced ? 140 : 440,
      ).finished
      if (generation !== this.generation) return
      const shield = this.layer(boss, 'tide-shield-break')
      await this.animate(
        shield,
        [
          { transform: 'scale(.7)', opacity: 1 },
          { transform: reduced ? 'scale(1)' : 'scale(2.4)', opacity: 0 },
        ],
        reduced ? 120 : 320,
      ).finished
    } catch {
      // The domain turn was already committed; cancellation only skips its presentation.
    } finally {
      if (generation === this.generation) this.cancel()
    }
  }

  /** Release both running and filled animations before repaint, resize or disposal. */
  cancel(): void {
    this.generation++
    this.root.querySelector('.tide-performing')?.classList.remove('tide-performing')
    for (const animation of this.animations) animation.cancel()
    this.animations.length = 0
    for (const layer of this.layers) layer.remove()
    this.layers.length = 0
  }
}
