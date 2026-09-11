import { relayReady } from '../game/floor-circuits.js'
import { spriteImage } from './dungeon-sprites.js'
import { niaImage } from './signal-performance.js'
import { signalCopy } from './signal-copy.js'
import type { Expedition } from '../types/variants.js'
import type { Language } from '../types/localization.js'

/** Decorate public mechanism locations without exposing their surrounding hidden clues. */
export function renderFloorCircuits(root: HTMLElement, run: Expedition, language: Language): void {
  const circuits = run.circuits
  if (!circuits) return

  const t = signalCopy(language)
  /** Resolve the active board cell used to position circuit landmarks and effects. */
  const cellAt = (index: number): HTMLElement | null =>
    root.querySelector(`[data-side="a"] [data-cell="${index}"]`)
  for (const relay of circuits.relays) {
    const cell = cellAt(relay.index)
    const gate = cellAt(relay.gate)
    if (cell) {
      const revealed = run.game.cells[relay.index]?.visibility === 'revealed'
      const ready = relayReady(run, relay)
      const label = `${t.relay}${relay.optional ? ` · ${t.optional}` : ''} · ${!relay.active ? t.released : ready ? t.ready : t.solve}`

      cell.classList.add('signal-relay', 'landmark-cell')
      cell.classList.toggle('signal-ready', ready)
      cell.classList.toggle('signal-off', !relay.active)
      cell.dataset['relay'] = String(relay.index)
      cell.title = label
      cell.setAttribute('aria-label', `${cell.getAttribute('aria-label')}, ${label}`)
      if (revealed)
        cell.innerHTML = `<span class="landmark-clue">${run.game.cells[relay.index]?.adjacent || ''}</span>`

      cell.insertAdjacentHTML(
        'afterbegin',
        spriteImage(relay.active ? 'bastion-pylon' : 'bastion-pylon-off'),
      )
    }

    if (gate) {
      gate.classList.add('signal-gate', 'landmark-cell')
      gate.classList.toggle('signal-released', !relay.active)
      gate.dataset['signalGate'] = String(relay.gate)
      gate.title = relay.active ? t.gate : t.released
      gate.setAttribute('aria-label', `${gate.getAttribute('aria-label')}, ${gate.title}`)
      gate.innerHTML = relay.active
        ? spriteImage('bastion-core')
        : `<span class="signal-open-gate" aria-hidden="true">⌁</span><span class="landmark-clue">${run.game.cells[relay.gate]?.adjacent || ''}</span>`
    }
  }

  if (circuits.record !== null && !circuits.recordTaken) {
    const cell = cellAt(circuits.record)

    cell?.classList.add('landmark-cell', 'signal-record')
    cell?.insertAdjacentHTML('afterbegin', spriteImage('survey-notes'))
    if (cell) {
      cell.title = `${t.record} · ${t.optional}`
      cell.setAttribute('aria-label', cell.title)
    }
  }

  if (run.departure.campaign === 'tower-relay-v1' && run.floor === 3) {
    const cell = cellAt(run.exit)
    if (cell) {
      cell.querySelector('.dungeon-sprite')?.remove()
      cell.insertAdjacentHTML('afterbegin', niaImage())
      cell.classList.add('signal-rescue')
      cell.setAttribute('aria-label', t.nia)
    }
  }
}

/** A released gate flashes once per accepted operation, never on unrelated flag renders. */
export async function animateCircuitChange(
  root: HTMLElement,
  before: Expedition | null,
  after: Expedition | null,
): Promise<void> {
  if (
    !before?.circuits ||
    !after?.circuits ||
    before.floor !== after.floor ||
    matchMedia('(prefers-reduced-motion: reduce)').matches
  )
    return

  const animations: Animation[] = []
  for (const relay of after.circuits.relays) {
    if (
      relay.active ||
      !before.circuits.relays.find((entry) => entry.index === relay.index)?.active
    )
      continue
    for (const index of [relay.index, relay.gate]) {
      const animation = root.querySelector(`[data-side="a"] [data-cell="${index}"]`)?.animate(
        [
          { boxShadow: 'inset 0 0 0 3px #e9ad47', filter: 'brightness(1.8)' },
          { boxShadow: 'inset 0 0 0 0px transparent', filter: 'brightness(1)' },
        ],
        { duration: 800, easing: 'ease-out' },
      )
      if (animation) animations.push(animation)
    }
  }

  await Promise.allSettled(animations.map((animation) => animation.finished))
}
