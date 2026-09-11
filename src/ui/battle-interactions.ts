import { removeTransientEffect } from './transient-effect.js'
import type { BattleInteractionEffect } from '../types/battle-feedback.js'
import type { Expedition } from '../types/variants.js'
import { spriteImage } from './dungeon-sprites.js'

/** Compare public state, so rejected actions and redraws cannot replay a successful interaction. */
export function battleInteractionEffects(
  before: Expedition | null,
  after: Expedition | null,
): readonly BattleInteractionEffect[] {
  const a = before?.encounter,
    b = after?.encounter
  if (
    !before ||
    !after ||
    !a ||
    !b ||
    before.phase !== 'boss' ||
    before.departure.seed !== after.departure.seed ||
    before.floor !== after.floor ||
    a.kind !== b.kind ||
    a.turn !== b.turn
  )
    return []

  const effects: BattleInteractionEffect[] = []
  /** Collect a public interaction cue without applying another gameplay action. */
  const add = (
    index: number,
    kind: BattleInteractionEffect['kind'],
    sprite: BattleInteractionEffect['sprite'] = null,
  ): void => {
    effects.push({ index, kind, sprite })
  }
  if (a.kind === 'brood' && b.kind === 'brood') {
    for (const index of a.webs) if (!b.webs.includes(index)) add(index, 'web-cut', 'brood-web')

    for (const index of a.nests)
      if (!b.nests.includes(index)) add(index, 'nest-break', 'brood-nest')

    for (const egg of a.eggs)
      if (!b.eggs.some((next) => next.index === egg.index)) add(egg.index, 'egg-break', 'brood-egg')

    for (const index of a.hatchlings)
      if (!b.hatchlings.includes(index)) add(index, 'hatchling-clear', 'brood-hatchling')
  }

  if (a.kind === 'bastion' && b.kind === 'bastion') {
    const disabled = new Set<number>()
    for (const pylon of a.pylons)
      if (pylon.active && b.pylons.some((next) => next.index === pylon.index && !next.active))
        disabled.add(pylon.index)

    for (const device of a.mechanisms)
      if (device.active && b.mechanisms.some((next) => next.index === device.index && !next.active))
        disabled.add(device.index)

    for (const index of disabled) add(index, 'power-down', 'bastion-pylon')

    if (b.exposedUntil > a.exposedUntil) add(b.boss, 'core-open')
  }

  if (a.kind === 'mirror' && b.kind === 'mirror') {
    if (a[a.active].seal.active && !b[a.active].seal.active)
      add(a[a.active].seal.index, 'seal-break', 'mirror-seal')
    if (a.active !== b.active) add(after.player, 'rift', 'mirror-rift')
  }

  if (a.kind === 'magnetic' && b.kind === 'magnetic') {
    if (
      b.forecast.kind === 'charge' &&
      (a.forecast.kind !== 'charge' ||
        a.forecast.anchor !== b.forecast.anchor ||
        a.forecast.resolvesOn !== b.forecast.resolvesOn)
    )
      add(b.forecast.anchor, 'anchor-on', 'magnetic-anchor')
  }

  if (a.kind === 'clock' && b.kind === 'clock') {
    for (const glass of a.hourglasses)
      if (!glass.used && b.hourglasses.some((next) => next.index === glass.index && next.used))
        add(glass.index, 'hourglass', 'clock-hourglass')
  }

  if (a.kind === 'echo' && b.kind === 'echo' && b.exposedUntil > a.exposedUntil)
    add(b.boss, 'echo-open')

  for (const reading of after.sonar.readings.slice(before.sonar.readings.length))
    add(reading.center, 'sonar', 'sonar')

  if (a.kind === 'matrix' && b.kind === 'matrix') {
    for (const index of b.collected)
      if (!a.collected.includes(index)) add(index, 'crystal', 'matrix-crystal')
    for (const index of b.empty) if (!a.empty.includes(index)) add(index, 'empty')
  }

  return effects
}

/** Keep disappearing objects visible just long enough to tear, crack or dissolve on their cell. */
export function animateBattleInteractions(
  root: HTMLElement,
  before: Expedition | null,
  after: Expedition | null,
): void {
  for (const effect of battleInteractionEffects(before, after)) {
    const cell = root.querySelector<HTMLElement>(`[data-side="a"] [data-cell="${effect.index}"]`)
    if (!cell) continue

    const layer = document.createElement('span')

    layer.className = `interaction-fx interaction-${effect.kind}`
    layer.setAttribute('aria-hidden', 'true')
    if (effect.sprite) layer.innerHTML = spriteImage(effect.sprite)

    cell.append(layer)
    removeTransientEffect(layer)
  }
}
