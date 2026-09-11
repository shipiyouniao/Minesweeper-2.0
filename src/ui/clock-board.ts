import { sharedStyles } from './shared-styles.js'
import { message } from '../i18n.js'
import { clockSpellCopy } from './clock-copy.js'

import type { Language } from '../types/localization.js'
import type { Expedition } from '../types/variants.js'
import { spriteImage } from './dungeon-sprites.js'
import { professionSprite } from './profession-presentation.js'

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
    cell.classList.toggle('clock-sealed', !e.hourglasses.some((glass) => glass.used))
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
      ? message(language, 'clock-board.spent-hourglass-walkable')
      : message(language, 'clock-board.hourglass-reveal-approach-return-earliest-spell-1')

    cell.setAttribute('aria-label', `${cell.getAttribute('aria-label')}, ${label}`)
    cell.title = label
  }

  if (run.phase !== 'boss') return

  if (index === e.echo.index) {
    cell.insertAdjacentHTML(
      'beforeend',
      `<span class="clock-echo ${e.echo.damage > 0 ? 'echo-charged' : ''}" aria-hidden="true">${spriteImage(professionSprite(run.departure.profession))}${e.echo.damage ? `<b class="echo-damage">${e.echo.damage}</b>` : ''}</span>`,
    )

    const label = message(language, 'clock-board.echo-pending-damage', { p0: e.echo.damage })

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
  ) {
    cell.classList.add('clock-impact')
    if (index === e.boss && e.resolution?.echoDamage)
      cell.insertAdjacentHTML(
        'beforeend',
        `<span class="echo-hit" aria-hidden="true">−${e.resolution.echoDamage}</span>`,
      )
  }
}

/** The queue exposes IDs and deadlines, including future spells absent from current danger cells. */
export function clockQueue(language: Language, run: Expedition): string {
  const e = run.encounter
  if (e?.kind !== 'clock') return ''

  const echo = message(language, 'clock-board.echo', {
    p0: e.echo.damage,
    p1:
      run.player === e.echo.index
        ? message(language, 'clock-board.echo-move')
        : message(language, 'clock-board.echo-ready'),
  })
  const result =
    e.resolution && (e.resolution.echoDamage || e.resolution.reflectedDamage)
      ? message(language, 'clock-board.last-turn-echo-returned-spell', {
          p0: e.resolution.echoDamage,
          p1: e.resolution.reflectedDamage,
        })
      : ''

  return `<div class="clock-queue ${sharedStyles['clock-queue']}"><strong>${echo}</strong>${result ? `<p>${result}</p>` : ''}<ul>${e.spells.map((spell) => `<li>${clockSpellCopy(language, spell, e.turn)}</li>`).join('')}</ul></div>`
}
