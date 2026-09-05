import { spriteImage } from './dungeon-sprites.js'
import { broodCellLabel } from './brood-copy.js'
import { battleText } from './combat-build-copy.js'
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
  if (
    encounter.destroyedNests &&
    (encounter.nests.includes(index) || encounter.destroyedNests.includes(index))
  ) {
    const destroyed = encounter.destroyedNests.includes(index)
    const revealed = run.game.cells[index]?.visibility === 'revealed'
    cell.classList.add('landmark-cell', 'nest-cell')
    cell.classList.toggle('nest-destroyed', destroyed)
    cell.innerHTML = `${spriteImage('brood-nest')}${revealed ? `<span class="landmark-clue">${run.game.cells[index]?.adjacent ?? 0}</span>` : ''}`
    cell.setAttribute(
      'aria-label',
      `${cell.getAttribute('aria-label')}, ${destroyed ? battleText(language, 'Nest destroyed', '巢穴已摧毁', '巣は破壊済み') : battleText(language, 'Nest · reveal and flag nearby mines to destroy', '巢穴 · 揭开并标出周围地雷后摧毁', '巣 · 開いて周囲の地雷に旗を立てて破壊')}`,
    )
  }
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
