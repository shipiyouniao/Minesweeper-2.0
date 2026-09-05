import { mirrorHeader } from './mirror-template.js'
import { combatStats } from '../game/combat-build.js'
import { battleStatus, combatStatsTemplate } from './battle-presentation.js'
import { battleText } from './combat-build-copy.js'
import { tacticalPlan, tacticalCellAction } from '../game/tactical-planning.js'
import { spriteImage } from './dungeon-sprites.js'
import { tacticalCopy, tacticalEventCopy } from './tactical-copy.js'
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
  const status = battleStatus(language, encounter)
  return `<section class="tactical-panel" aria-label="${t.name}">${encounter.kind === 'mirror' ? mirrorHeader(language, encounter) : `<div class="tactical-heading">${spriteImage(bossSprite(encounter))}<div><h3>${t.name}</h3><strong>${encounter.health} / ${encounter.maxHealth}</strong><p class="boss-status">${status}</p></div></div>`}
    <div class="tactical-counters"><span>${t.turn} <strong>${encounter.turn}</strong></span><span>${t.points} <strong class="tactical-points">${Math.min(combatStats(run).actions, encounter.points)} / ${combatStats(run).actions}${encounter.points > combatStats(run).actions ? ` (+${encounter.points - combatStats(run).actions})` : ''}</strong></span></div>
    ${combatStatsTemplate(language, run)}
    <p class="tactical-event" role="status" tabindex="-1">${tacticalEventCopy(language, encounter)}</p>
    ${encounter.kind === 'mirror' ? '' : tacticalControlsTemplate(language, run)}
    <p class="tactical-plan" role="status">${t.hint}</p></section>`
}

/** Keep the single set of combat controls near the boards in the two-realm encounter. */
export function tacticalControlsTemplate(language: Language, run: Expedition): string {
  const encounter = run.encounter
  if (!encounter || run.phase !== 'boss') return ''
  const strike = tacticalCellAction(run, encounter.boss)
  const strikeLabel =
    strike.type === 'interact'
      ? battleText(language, 'Prime core · 1 AP', '启动核心 · 1 点', 'コア起動 · 1')
      : null
  const t = tacticalCopy(language, encounter.kind)
  return `<div class="tactical-controls">${encounter.kind === 'mirror' ? `<button data-control="shift" ${tacticalPlan(run, { type: 'shift' }).allowed ? '' : 'disabled'}>${spriteImage('mirror-rift')}${battleText(language, 'Shift realm · 1 AP', '切换镜域 · 1 点', '鏡界転移 · 1')}</button>` : ''}<button data-control="attack" ${tacticalPlan(run, strike).allowed ? '' : 'disabled'}>${spriteImage('bastion-strike')}${strikeLabel ?? t.attack}</button><button data-control="brace" ${tacticalPlan(run, { type: 'brace' }).allowed ? '' : 'disabled'}>${spriteImage('shield')}${t.brace}</button><button class="primary-button" data-control="end-turn">${spriteImage('bastion-intent')}${t.end}</button></div>`
}
