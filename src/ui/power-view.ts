import { feedPowered, powerReadiness, powerObjectiveComplete } from '../game/floor-power.js'
import { message } from '../i18n.js'
import { waterwayFloorName } from './waterway-copy.js'
import { observatoryFloorName, powerHint } from './observatory-copy.js'
import { spriteImage } from './dungeon-sprites.js'
import { icon } from '../icons.js'
import { sharedStyles } from './shared-styles.js'
import type { Expedition } from '../types/variants.js'
import type { Language } from '../types/localization.js'
import type { PowerFeed } from '../types/floor-power.js'

/** The same original instrument marks the world entrance, devices and the completed reading. */
export function observatoryImage(): string {
  return `<img class="dungeon-sprite ridge-instrument" src="${import.meta.env.BASE_URL}assets/story/observatory.png" alt="" width="128" height="128" draggable="false">`
}

/** The drainage pump identifies the world entrance and every chamber's receiver. */
export function drainageImage(): string {
  return `<img class="dungeon-sprite drainage-pump" src="${import.meta.env.BASE_URL}assets/story/drainage-pump.png" alt="" width="128" height="128" draggable="false">`
}

/** Keep one current instruction and a compact reading counter above the shared board layout. */
export function powerObjective(language: Language, run: Expedition): string {
  if (!run.power) return ''
  const drainage = run.power.purpose === 'drainage'
  return `<section class="signal-objective power-objective" aria-live="polite"><strong>${drainage ? waterwayFloorName(language, run.floor) : observatoryFloorName(language, run.floor)}</strong><p>${powerObjectiveComplete(run.power) ? (drainage ? message(language, 'waterway.exit-ready') : message(language, 'ridge.exit-ready')) : drainage ? message(language, 'waterway.objective') : message(language, 'ridge.objective')}</p><span>${drainage ? message(language, 'waterway.progress', { count: run.power.receivers.filter((entry) => entry.recorded).length, total: run.power.receivers.length }) : message(language, 'ridge.progress', { count: run.power.receivers.filter((entry) => entry.recorded).length, total: run.power.receivers.length })}</span><button type="button" class="power-help secondary-button ${sharedStyles['secondary-button']}" data-control="help" aria-haspopup="dialog">${icon('help')}${message(language, 'ridge.network')}</button></section>`
}

/** Identify a source and branch with text as well as color, including in accessible labels. */
function feedLabel(run: Expedition, input: PowerFeed): string {
  return `${run.power!.junctions.findIndex((entry) => entry.index === input.junction) + 1}${input.branch === 0 ? 'A' : 'B'}`
}

/** Draw only known mechanism positions; ordinary hidden numbers and flags remain untouched. */
export function renderFloorPower(root: HTMLElement, run: Expedition, language: Language): void {
  const power = run.power
  if (!power) return
  const board = root.querySelector<HTMLElement>('[data-side="a"]')
  if (board) {
    board.dataset['powerPurpose'] = power.purpose
    board.style.setProperty('--power-rows', String(run.game.config.height))
  }
  const controls = [
    ...power.junctions.map((entry) => ({ index: entry.index, kind: 'junction' as const })),
    ...power.receivers.map((entry) => ({ index: entry.index, kind: 'receiver' as const })),
    ...power.doors.map((entry) => ({ index: entry.index, kind: 'door' as const })),
  ]
  for (const control of controls) {
    const cell = root.querySelector<HTMLElement>(`[data-side="a"] [data-cell="${control.index}"]`)
    if (!cell) continue
    const junction = power.junctions.find((entry) => entry.index === control.index)
    const receiver = power.receivers.find((entry) => entry.index === control.index)
    const door = power.doors.find((entry) => entry.index === control.index)
    const input = junction?.input ?? receiver?.input ?? door?.input
    const live = !input || feedPowered(power, input)
    const revealed = run.game.cells[control.index]?.visibility === 'revealed'
    const name = junction
      ? message(language, 'ridge.junction')
      : receiver
        ? power.purpose === 'drainage'
          ? message(language, 'waterway.receiver')
          : message(language, 'ridge.receiver')
        : message(language, 'ridge.door')
    const id = junction
      ? `${power.junctions.indexOf(junction) + 1}${junction.selected === null ? '—' : junction.selected === 0 ? 'A' : 'B'}`
      : input
        ? feedLabel(run, input)
        : ''
    const label = `${name} ${id} · ${door ? (live ? message(language, 'ridge.open') : message(language, 'ridge.closed')) : powerHint(language, powerReadiness(run, control.index), power.purpose)}`
    cell.classList.add('landmark-cell', 'power-cell', `power-${control.kind}`)
    cell.classList.toggle('power-live', live)
    cell.classList.toggle('power-recorded', !!receiver?.recorded)
    cell.classList.toggle('power-ready', !door && powerReadiness(run, control.index) === 'ready')
    cell.dataset['powerCell'] = String(control.index)
    cell.dataset['powerKind'] = control.kind
    cell.title = label
    cell.setAttribute('aria-label', `${cell.getAttribute('aria-label')}, ${label}`)
    if (revealed || door)
      cell.innerHTML = `<span class="landmark-clue">${revealed ? run.game.cells[control.index]?.adjacent || '' : ''}</span>`
    cell.insertAdjacentHTML(
      'afterbegin',
      receiver
        ? power.purpose === 'drainage'
          ? drainageImage()
          : observatoryImage()
        : junction
          ? spriteImage('bastion-pylon')
          : live
            ? '<span class="power-open" aria-hidden="true">⌁</span>'
            : spriteImage('bastion-core'),
    )
    cell.insertAdjacentHTML(
      'beforeend',
      `<span class="power-label">${receiver?.recorded ? '✓ ' : ''}${id}</span>`,
    )
  }
}

/** Pulse an accepted selector, its connected devices and doors; capture is a separate flourish. */
export async function animatePowerChange(
  root: HTMLElement,
  before: Expedition | null,
  after: Expedition | null,
): Promise<void> {
  if (
    !before?.power ||
    !after?.power ||
    before.power === after.power ||
    before.floor !== after.floor ||
    matchMedia('(prefers-reduced-motion: reduce)').matches
  )
    return
  const changed = after.power.junctions.filter(
    (entry) =>
      entry.selected !== before.power?.junctions.find((old) => old.index === entry.index)?.selected,
  )
  const targets = new Set(changed.map((entry) => entry.index))
  for (const entry of [...after.power.doors, ...after.power.receivers]) {
    if (feedPowered(before.power, entry.input) !== feedPowered(after.power, entry.input))
      targets.add(entry.index)
  }
  for (const entry of after.power.receivers)
    if (
      entry.recorded &&
      !before.power.receivers.find((old) => old.index === entry.index)?.recorded
    )
      targets.add(entry.index)
  const animations: Animation[] = []
  const waterEffects: HTMLElement[] = []
  for (const index of targets) {
    const cell = root.querySelector<HTMLElement>(`[data-power-cell="${index}"]`)
    const picture = cell?.querySelector<HTMLElement>('img, .power-open')
    // A completed pump visibly lowers its water while the handwheel turns.
    const draining =
      after.power.purpose === 'drainage' &&
      after.power.receivers.some((entry) => entry.index === index && entry.recorded) &&
      !before.power.receivers.find((entry) => entry.index === index)?.recorded
    if (cell && draining) {
      const water = document.createElement('span')
      water.className = 'power-drain'
      water.setAttribute('aria-hidden', 'true')
      cell.append(water)
      waterEffects.push(water)
      animations.push(
        water.animate(
          [
            { transform: 'translateY(0)', opacity: 0.7 },
            { transform: 'translateY(100%)', opacity: 0 },
          ],
          { duration: 1000, easing: 'ease-in' },
        ),
      )
    }
    const ordinal = [...targets].indexOf(index)
    const frames =
      draining || changed.some((entry) => entry.index === index)
        ? [
            { transform: 'rotate(-18deg)' },
            { transform: 'rotate(12deg)' },
            { transform: 'rotate(0)' },
          ]
        : [
            { transform: 'scale(.78)', filter: 'brightness(1.9)' },
            { transform: 'scale(1)', filter: 'brightness(1)' },
          ]
    const motion = picture?.animate(frames, {
      duration: 600,
      delay: ordinal * 60,
      easing: 'ease-out',
    })
    const flash = cell?.animate(
      [{ boxShadow: 'inset 0 0 0 3px #d4aa4e' }, { boxShadow: 'inset 0 0 0 0 transparent' }],
      { duration: 750, delay: ordinal * 60 },
    )
    if (motion) animations.push(motion)
    if (flash) animations.push(flash)
  }
  await Promise.allSettled(animations.map((entry) => entry.finished))
  for (const effect of waterEffects) effect.remove()
}
