import { spriteImage } from './dungeon-sprites.js'
import { broodCellLabel } from './brood-copy.js'
import type { Expedition } from '../types/variants.js'
import type { Language } from '../types/localization.js'

/** Render public occupants and countdowns above the original clue, preserving cell focus targets. */
export function markBroodCell(
  language: Language,
  run: Expedition,
  cell: HTMLElement,
  index: number,
): void {
  const encounter = run.encounter
  if (encounter?.kind !== 'brood' || run.phase !== 'boss') return
  const egg = encounter.eggs.find((entry) => entry.index === index)
  const web = encounter.webs.includes(index)
  const hatchling = encounter.hatchlings.includes(index)
  if (egg || web || hatchling) {
    cell.classList.add('brood-occupant')
    const sprite = egg ? 'brood-egg' : web ? 'brood-web' : 'brood-hatchling'
    const clue = run.game.cells[index]?.adjacent ?? 0
    cell.innerHTML = `${spriteImage(sprite)}${clue ? `<span class="landmark-clue">${clue}</span>` : ''}${egg ? `<span class="brood-countdown">${egg.turns}</span>` : ''}`
    cell.setAttribute(
      'aria-label',
      `${cell.getAttribute('aria-label')}, ${broodCellLabel(language, encounter, index)}`,
    )
  }
  const destination = encounter.orders.some(
    (order) =>
      order.to === index && order.from !== index && encounter.hatchlings.includes(order.from),
  )
  if (destination) {
    cell.insertAdjacentHTML(
      'beforeend',
      `<span class="brood-next">${spriteImage('brood-hatchling')}</span>`,
    )
    const label =
      language === 'zh'
        ? '幼虫下一落点'
        : language === 'ja'
          ? '幼体の次の位置'
          : 'Next hatchling position'
    cell.setAttribute('aria-label', `${cell.getAttribute('aria-label')}, ${label}`)
  }
}
