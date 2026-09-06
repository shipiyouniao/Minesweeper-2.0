import { clockSpellCopy } from './clock-copy.js'
import { battleText } from './combat-build-copy.js'
import { spriteImage } from './dungeon-sprites.js'
import { professionSprite } from './profession-presentation.js'
import type { Expedition } from '../types/variants.js'
import type { Language } from '../types/localization.js'

/** Show all deadlines together while leaving the clue number and actual pawn unobstructed. */
export function markClockCell(
  language: Language,
  run: Expedition,
  cell: HTMLElement,
  index: number,
  animate = false,
): void {
  const e = run.encounter
  if (e?.kind !== 'clock') return
  if (index === e.boss) {
    cell.classList.add('clock-boss')
    cell.classList.toggle('clock-recovery', e.recoveryUntil >= e.turn)
    cell.classList.toggle('clock-defeated', e.health === 0)
  }
  const glass = e.hourglasses.find((entry) => entry.index === index)
  if (glass) {
    cell.classList.add('landmark-cell', 'clock-hourglass')
    cell.classList.toggle('clock-used', glass.used)
    const revealed = run.game.cells[index]?.visibility === 'revealed'
    cell.innerHTML = `${spriteImage('clock-hourglass')}${revealed ? `<span class="landmark-clue">${run.game.cells[index]?.adjacent ?? 0}</span>` : ''}`
    const label = glass.used
      ? battleText(
          language,
          'Spent hourglass · walkable',
          '沙漏已使用 · 可通行',
          '使用済み砂時計 · 通行可能',
        )
      : battleText(
          language,
          'Hourglass · reveal, approach, return earliest spell · 1 AP',
          '沙漏 · 揭开并靠近，转送最早法术 · 1 点',
          '砂時計 · 開いて接近、最も早い術を返送 · 1',
        )
    cell.setAttribute('aria-label', `${cell.getAttribute('aria-label')}, ${label}`)
    cell.title = label
  }
  if (run.phase !== 'boss') return
  if (index === e.echo.index) {
    cell.insertAdjacentHTML(
      'beforeend',
      `<span class="clock-echo" aria-hidden="true">${spriteImage(professionSprite(run.departure.profession))}</span>`,
    )
    const label = battleText(
      language,
      `Echo · pending damage ${e.echo.damage}`,
      `残影 · 待结算伤害 ${e.echo.damage}`,
      `残像 · 追撃ダメージ${e.echo.damage}`,
    )
    cell.setAttribute('aria-label', `${cell.getAttribute('aria-label')}, ${label}`)
  }
  const spells = e.spells.filter((spell) => spell.targets.includes(index))
  if (spells.length) {
    cell.classList.add('clock-mark')
    const labels = spells.map((spell) => clockSpellCopy(language, spell, e.turn)).join('; ')
    cell.insertAdjacentHTML(
      'beforeend',
      `<span class="clock-countdowns" aria-hidden="true">${spells.map((spell) => `<b class="${spell.redirected ? 'returned' : spell.resolvesOn === e.turn ? 'due' : ''}">${spell.redirected ? '↶' : ''}${spell.resolvesOn - e.turn + 1}</b>`).join('')}</span>`,
    )
    cell.setAttribute('aria-label', `${cell.getAttribute('aria-label')}, ${labels}`)
    cell.title = [cell.title, labels].filter(Boolean).join('; ')
  }
  if (
    animate &&
    (e.resolution?.cells.includes(index) ||
      (e.resolution?.echoDamage && (index === e.resolution.echoIndex || index === e.boss)))
  )
    cell.classList.add('clock-impact')
}

/** The queue exposes IDs and deadlines, including future spells absent from current danger cells. */
export function clockQueue(language: Language, run: Expedition): string {
  const e = run.encounter
  if (e?.kind !== 'clock') return ''
  const echo = battleText(
    language,
    `Echo follow-up: ${e.echo.damage}`,
    `残影补刀：${e.echo.damage}`,
    `残像の追撃：${e.echo.damage}`,
  )
  const result =
    e.resolution && (e.resolution.echoDamage || e.resolution.reflectedDamage)
      ? battleText(
          language,
          `Last turn: echo ${e.resolution.echoDamage}, returned spell ${e.resolution.reflectedDamage}`,
          `上回合：残影 ${e.resolution.echoDamage}，转送法术 ${e.resolution.reflectedDamage}`,
          `前ターン：残像${e.resolution.echoDamage}、返送${e.resolution.reflectedDamage}`,
        )
      : ''
  return `<div class="clock-queue"><strong>${echo}</strong>${result ? `<p>${result}</p>` : ''}<ul>${e.spells.map((spell) => `<li>${clockSpellCopy(language, spell, e.turn)}</li>`).join('')}</ul></div>`
}
