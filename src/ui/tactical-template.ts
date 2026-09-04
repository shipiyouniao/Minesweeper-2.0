import { tacticalPlan } from '../game/tactical-planning.js'
import { spriteImage } from './dungeon-sprites.js'
import { tacticalCopy, tacticalEventCopy } from './tactical-copy.js'
import { broodStatus } from './brood-copy.js'
import { bossSprite } from './tactical-sprites.js'
import type { Expedition } from '../types/variants.js'
import type { Language } from '../types/localization.js'

/** Present the active boss's public state and explicit turn controls beside the shared health bar. */
export function tacticalTemplate(language: Language, run: Expedition): string {
  const encounter = run.encounter
  if (!encounter) return ''
  const t = tacticalCopy(language, encounter.kind)
  if (run.phase !== 'boss')
    return encounter.health === 0 ? `<p class="tactical-victory">${t.victory}</p>` : ''
  const armored =
    encounter.kind === 'bastion' ? encounter.pylons.filter((pylon) => pylon.active).length : 0
  const status =
    encounter.kind === 'brood'
      ? broodStatus(language, encounter)
      : armored
        ? `${t.armor} ${armored} / 2`
        : t.exposed
  return `<section class="tactical-panel" aria-label="${t.name}"><div class="tactical-heading">${spriteImage(bossSprite(encounter))}<div><h3>${t.name}</h3><strong>${encounter.health} / ${encounter.maxHealth}</strong><p class="boss-status">${status}</p></div></div>
    <div class="tactical-counters"><span>${t.turn} <strong>${encounter.turn}</strong></span><span>${t.points} <strong class="tactical-points">${Math.min(3, encounter.points)} / 3${encounter.points > 3 ? ` (+${encounter.points - 3})` : ''}</strong></span></div>
    <p class="tactical-event" role="status" tabindex="-1">${tacticalEventCopy(language, encounter)}</p>
    <div class="tactical-controls"><button data-control="attack" ${tacticalPlan(run, { type: 'attack' }).allowed ? '' : 'disabled'}>${spriteImage('bastion-strike')}${t.attack}</button><button data-control="brace" ${tacticalPlan(run, { type: 'brace' }).allowed ? '' : 'disabled'}>${spriteImage('shield')}${t.brace}</button><button class="primary-button" data-control="end-turn">${spriteImage('bastion-intent')}${t.end}</button></div>
    <p class="tactical-plan" role="status">${t.hint}</p></section>`
}
