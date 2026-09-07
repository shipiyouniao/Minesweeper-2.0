import { echoCandidates, echoObscured } from '../game/expedition-sonar.js'
import { message, translations } from '../i18n.js'
import type { Language } from '../types/localization.js'
import type { Expedition } from '../types/variants.js'
import { spriteImage } from './dungeon-sprites.js'

/** Render only public candidates, never the hidden active-core coordinate. */
export function markEchoCell(
  language: Language,
  run: Expedition,
  cell: HTMLElement,
  index: number,
): void {
  const e = run.encounter
  if (e?.kind !== 'echo') return
  const common = translations[language]
  const coordinates = `${common.row} ${Math.floor(index / run.game.config.width) + 1}, ${common.column} ${(index % run.game.config.width) + 1}`
  if (e.bodies.includes(index)) {
    const candidates = echoCandidates(run)
    cell.classList.remove('wall-cell')
    cell.classList.add('boss-cell', 'echo-body')
    cell.classList.toggle('echo-excluded', !candidates.includes(index))
    cell.classList.toggle('echo-located', candidates.length === 1 && candidates[0] === index)
    cell.removeAttribute('aria-disabled')
    cell.removeAttribute('data-number')
    cell.innerHTML = `${spriteImage('echo-warden')}<span class="echo-body-label">${e.bodies.indexOf(index) + 1}</span>`
    cell.setAttribute(
      'aria-label',
      `${coordinates}, ${message(language, 'echo.body', { body: e.bodies.indexOf(index) + 1 })}`,
    )
  } else if (echoObscured(run, index)) {
    cell.classList.add('echo-obscured')
    cell.removeAttribute('data-number')
    cell.removeAttribute('title')
    const clue = cell.querySelector<HTMLElement>('.landmark-clue')
    if (clue) clue.textContent = '≈'
    else if (!cell.querySelector('img')) cell.textContent = '≈'
    cell.setAttribute('aria-label', `${coordinates}, ${message(language, 'echo.obscured')}`)
  }
}

/** Keep mine observations available after resonance observations expire. */
export function expeditionReadings(language: Language, run: Expedition): string {
  const e = run.encounter?.kind === 'echo' ? run.encounter : null
  if (!e && !run.departure.equipment.includes('sonar')) return ''
  const items = run.sonar.readings
    .filter(
      (reading) =>
        reading.realm === (run.encounter?.kind === 'mirror' ? run.encounter.active : null),
    )
    .map((reading) => {
      const mine = message(language, 'echo.reading', {
        row: Math.floor(reading.center / run.game.config.width) + 1,
        column: (reading.center % run.game.config.width) + 1,
        mines: reading.mines,
      })
      const resonance =
        reading.resonance === null
          ? ''
          : reading.phase !== e?.phase
            ? message(language, 'echo.stale')
            : reading.resonance
              ? message(language, 'echo.present')
              : message(language, 'echo.absent')
      return `<li><button type="button" data-sonar-reading="${reading.center}"><span>${mine}</span>${resonance ? `<small>${resonance}</small>` : ''}</button></li>`
    })
    .join('')
  const status = e
    ? message(language, 'echo.loan', { charges: run.sonar.loan, progress: run.sonar.loanProgress })
    : `${message(language, 'sonar-equipment.name')} · ${run.sonar.charges}/3 · ${run.sonar.progress}/12`
  return `<section class="expedition-sonar-log"><strong>${status}</strong>${
    e
      ? `<p>${message(language, 'echo.candidates', {
          bodies: echoCandidates(run)
            .map((index) => e.bodies.indexOf(index) + 1)
            .join(' · '),
        })}</p>`
      : ''
  }<ol>${items}</ol></section>`
}
