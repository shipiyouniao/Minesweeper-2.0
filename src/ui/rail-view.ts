import { railMotion, railObjectiveComplete } from '../game/floor-rail.js'
import { message } from '../i18n.js'
import { icon } from '../icons.js'
import { sharedStyles } from './shared-styles.js'
import type { Expedition } from '../types/variants.js'
import type { Language } from '../types/localization.js'

/** Original art is shared between the doorway, cart animation and illustrated instructions. */
export function cartImage(): string {
  return `<img class="dungeon-sprite rail-cart" src="${import.meta.env.BASE_URL}assets/story/minecart.png" alt="" width="128" height="128" draggable="false">`
}

/** A rescued character retains the same face on the board, at camp and in dialogue. */
export function tomaImage(): string {
  return `<img class="dungeon-sprite rail-toma" src="${import.meta.env.BASE_URL}assets/story/toma.png" alt="" width="128" height="128" draggable="false">`
}

/** Compact controls invoke the same physical levers as board clicks, including keyboard and touch. */
export function railObjective(language: Language, run: Expedition): string {
  const rail = run.rail
  if (!rail) return ''
  const name =
    run.floor === 1
      ? message(language, 'rail.floor-1')
      : run.floor === 2
        ? message(language, 'rail.floor-2')
        : message(language, 'rail.floor-3')
  const objective = railObjectiveComplete(rail)
    ? message(language, 'rail.exit-ready')
    : run.floor === 3
      ? message(language, 'rail.objective-rescue')
      : message(language, 'rail.objective')
  return `<section class="signal-objective rail-objective" aria-live="polite"><strong>${name}</strong><p>${objective}</p><div class="rail-controls"><button data-control="rail-control:${rail.drive}" title="${message(language, 'rail.drive-detail')}">${cartImage()}${message(language, 'rail.drive')}</button><button data-control="rail-control:${rail.reverse}" title="${message(language, 'rail.reverse-detail')}">↶ ${message(language, 'rail.reverse')}</button>${rail.turnouts.map((entry, i) => `<button data-control="rail-control:${entry.index}" aria-label="${message(language, 'rail.turnout')} ${i + 1}: ${entry.selected ? 'B' : 'A'}">⑂ ${i + 1}${entry.selected ? 'B' : 'A'}</button>`).join('')}<button class="secondary-button ${sharedStyles['secondary-button']}" data-control="help" aria-haspopup="dialog">${icon('help')}${message(language, 'rail.help')}</button></div><span>${message(language, 'rail.progress', { count: rail.stations.filter((station) => station.visited).length, total: rail.stations.length })}</span><small data-rail-feedback>${railStopHint(language, run)}</small></section>`
}

/** Draw public rail geometry beneath flags and clues; hidden hazard truth never affects the SVG. */
export function renderFloorRail(root: HTMLElement, run: Expedition, language: Language): void {
  const rail = run.rail
  if (!rail) return
  const board = root.querySelector<HTMLElement>('[data-side="a"]')
  board?.classList.add('rail-board')
  // Put numbers above larger landmarks; ordinary flags keep their normal center position.
  for (const index of [
    rail.cart,
    rail.drive,
    rail.reverse,
    ...rail.turnouts.map((entry) => entry.index),
    ...rail.stations.map((entry) => entry.index),
  ]) {
    const cell = board?.querySelector<HTMLElement>(`[data-cell="${index}"]`)
    if (cell && run.game.cells[index]?.visibility === 'revealed' && !run.game.cells[index]?.mine)
      cell.innerHTML = `<span class="landmark-clue">${run.game.cells[index]?.adjacent || ''}</span>`
  }
  const forecast = railMotion(run).path
  for (const track of rail.tracks) {
    const cell = board?.querySelector<HTMLElement>(`[data-cell="${track.index}"]`)
    if (!cell) continue
    const x = track.index % run.game.config.width
    const y = Math.floor(track.index / run.game.config.width)
    const paths = track.neighbors
      .map(
        (index) =>
          `<path d="M50 50 L${50 + 50 * ((index % run.game.config.width) - x)} ${50 + 50 * (Math.floor(index / run.game.config.width) - y)}"/>`,
      )
      .join('')
    cell.classList.add('rail-track')
    cell.classList.toggle('rail-forecast', forecast.includes(track.index))
    cell.insertAdjacentHTML(
      'afterbegin',
      `<svg class="rail-track-art" viewBox="0 0 100 100" aria-hidden="true">${paths}</svg>`,
    )
  }
  for (const index of [
    rail.drive,
    rail.reverse,
    ...rail.turnouts.map((entry) => entry.index),
    ...rail.stations.map((entry) => entry.index),
  ]) {
    const cell = board?.querySelector<HTMLElement>(`[data-cell="${index}"]`)
    if (!cell) continue
    const turnout = rail.turnouts.find((entry) => entry.index === index)
    const station = rail.stations.find((entry) => entry.index === index)
    const label = turnout
      ? `${message(language, 'rail.turnout')} ${rail.turnouts.indexOf(turnout) + 1}${turnout.selected ? 'B' : 'A'}`
      : station
        ? `${station.kind === 'brake' ? message(language, 'rail.brake') : station.kind === 'home' ? message(language, 'rail.home-stop') : message(language, 'rail.toma')} ${rail.stations.indexOf(station) + 1}`
        : index === rail.drive
          ? message(language, 'rail.drive')
          : message(language, 'rail.reverse')
    cell.dataset['railCell'] = String(index)
    cell.title = label
    cell.setAttribute(
      'aria-label',
      `${cell.getAttribute('aria-label')}, ${label}${station?.visited ? ' ✓' : ''}`,
    )
    const picture = turnout
      ? `⑂<small>${rail.turnouts.indexOf(turnout) + 1}${turnout.selected ? 'B' : 'A'}</small>`
      : station
        ? station.kind === 'passenger' && !station.visited
          ? tomaImage()
          : `${station.visited ? '✓' : station.kind === 'home' ? '⌂' : '▣'}`
        : index === rail.drive
          ? '▷'
          : '↶'
    cell.insertAdjacentHTML(
      'beforeend',
      `<span class="rail-landmark ${station?.visited ? 'rail-complete' : ''}">${picture}</span>`,
    )
  }
  for (const [ordinal, turnout] of rail.turnouts.entries())
    for (const [branch, index] of turnout.branches.entries())
      board
        ?.querySelector(`[data-cell="${index}"]`)
        ?.insertAdjacentHTML(
          'beforeend',
          `<small class="rail-branch">${ordinal + 1}${branch ? 'B' : 'A'}</small>`,
        )
  for (const door of rail.doors) {
    const ordinal = rail.stations.findIndex((station) => station.index === door.station) + 1
    board
      ?.querySelector(`[data-cell="${door.index}"]`)
      ?.insertAdjacentHTML('beforeend', `<small class="rail-branch">${ordinal}</small>`)
  }
  const cart = board?.querySelector<HTMLElement>(`[data-cell="${rail.cart}"]`)
  const passenger =
    rail.stations.some((station) => station.kind === 'passenger' && station.visited) &&
    !railObjectiveComplete(rail)
  cart?.insertAdjacentHTML(
    'beforeend',
    `<span class="rail-vehicle" data-rail-vehicle>${passenger ? tomaImage() : ''}${cartImage()}</span>`,
  )
}

/** Follow the accepted path, preserving scroll clipping and honoring reduced motion. */
export async function animateRailChange(
  root: HTMLElement,
  before: Expedition | null,
  after: Expedition | null,
): Promise<void> {
  if (
    !before?.rail ||
    !after?.rail ||
    before.floor !== after.floor ||
    matchMedia('(prefers-reduced-motion: reduce)').matches
  )
    return
  const rail = after.rail
  const vehicle = root.querySelector<HTMLElement>('[data-rail-vehicle]')
  if (!vehicle) return
  const boarding = rail.stations.find(
    (station) =>
      station.kind === 'passenger' &&
      station.visited &&
      !before.rail?.stations.find((old) => old.index === station.index)?.visited,
  )
  const unloading =
    railObjectiveComplete(rail) &&
    !railObjectiveComplete(before.rail) &&
    rail.stations.some((station) => station.kind === 'passenger')
  const passenger = vehicle.querySelector<HTMLElement>('.rail-toma')
  const platform = boarding
    ? root.querySelector<HTMLElement>(`[data-rail-cell="${boarding.index}"] .rail-landmark`)
    : null
  // Presentation follows the trip: the waiting miner boards only once the cart reaches him.
  if (boarding && passenger) passenger.style.visibility = 'hidden'
  if (platform) platform.innerHTML = tomaImage()
  if (unloading) vehicle.insertAdjacentHTML('afterbegin', tomaImage())
  const endpoint = vehicle.getBoundingClientRect()
  const target = root
    .querySelector<HTMLElement>(`[data-side="a"] [data-cell="${rail.cart}"]`)
    ?.getBoundingClientRect()
  const frames = rail.travel.flatMap((index) => {
    const rect = root
      .querySelector<HTMLElement>(`[data-side="a"] [data-cell="${index}"]`)
      ?.getBoundingClientRect()
    return rect && target
      ? [{ transform: `translate(${rect.x - target.x}px, ${rect.y - target.y}px)` }]
      : []
  })
  if (frames.length > 1 && endpoint.width > 0) {
    // Raise the host as well as its sprite; sibling cells must not cover the passing cart.
    vehicle.parentElement?.classList.add('rail-moving-cell')
    await Promise.allSettled([
      vehicle.animate(frames, {
        duration: Math.min(1800, 140 * frames.length),
        easing: 'ease-in-out',
      }).finished,
    ])
    vehicle.parentElement?.classList.remove('rail-moving-cell')
    if (boarding && passenger) {
      passenger.style.visibility = ''
      if (platform) platform.innerHTML = '✓'
      await Promise.allSettled([
        passenger.animate(
          [
            { transform: 'translateY(-12px)', opacity: 0 },
            { transform: 'translateY(0)', opacity: 1 },
          ],
          { duration: 380, easing: 'ease-out' },
        ).finished,
      ])
    }
    if (unloading) {
      const leaving = vehicle.querySelector<HTMLElement>('.rail-toma')
      if (leaving) {
        await Promise.allSettled([
          leaving.animate(
            [
              { transform: 'translateY(0)', opacity: 1 },
              { transform: 'translateY(-12px)', opacity: 0 },
            ],
            { duration: 380, easing: 'ease-in' },
          ).finished,
        ])
        leaving.remove()
      }
    }
  } else {
    const changed = rail.turnouts.find(
      (entry) =>
        entry.selected !== before.rail?.turnouts.find((old) => old.index === entry.index)?.selected,
    )
    const lever = root.querySelector<HTMLElement>(
      `[data-rail-cell="${changed?.index}"] .rail-landmark`,
    )
    if (lever)
      await Promise.allSettled([
        lever.animate(
          [
            { transform: 'rotate(-18deg)' },
            { transform: 'rotate(12deg)' },
            { transform: 'rotate(0)' },
          ],
          { duration: 450 },
        ).finished,
      ])
  }
}

/** Explain only the public obstacle at the end of the forward preview. */
function railStopHint(language: Language, run: Expedition): string {
  switch (railMotion(run).stop) {
    case 'covered':
      return message(language, 'rail.stop-covered')
    case 'blocked':
      return message(language, 'rail.stop-blocked')
    case 'turnout':
      return message(language, 'rail.stop-turnout')
    case 'station':
      return message(language, 'rail.stop-station')
    case 'buffer':
      return message(language, 'rail.stop-buffer')
  }
}
