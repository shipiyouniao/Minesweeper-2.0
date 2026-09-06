import { clockQueue } from './clock-board.js'
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

/** Present the active boss's public state in the compact sidebar. */
export function tacticalTemplate(language: Language, run: Expedition): string {
  const encounter = run.encounter
  if (!encounter) return ''
  const t = tacticalCopy(language, encounter.kind)
  if (run.phase !== 'boss')
    return encounter.health === 0 ? `<p class="tactical-victory">${t.victory}</p>` : ''
  const status = battleStatus(language, encounter)
  return `<section class="tactical-panel" aria-label="${t.name}">${encounter.kind === 'mirror' ? mirrorHeader(language, encounter) : `<div class="tactical-heading">${spriteImage(bossSprite(encounter))}<div><h3>${t.name}</h3><strong>${encounter.health} / ${encounter.maxHealth}</strong><p class="boss-status">${status}</p></div></div>`}
    <div class="tactical-counters"><span>${t.turn} <strong>${encounter.turn}</strong></span><span>${t.points} <strong class="tactical-points">${Math.min(combatStats(run).actions, encounter.points)} / ${combatStats(run).actions}${encounter.points > combatStats(run).actions ? ` (+${encounter.points - combatStats(run).actions})` : ''}</strong></span></div>
    ${combatStatsTemplate(language, run)}${clockQueue(language, run)}
    <p class="tactical-event" role="status" tabindex="-1">${tacticalEventCopy(language, encounter)}</p>
    <div class="battle-reference-actions"><button class="text-button prologue-replay" data-control="prologue">${battleText(language, 'Replay arrival', '重看开场', '登場をもう一度')}</button><button class="text-button" data-control="help">${battleText(language, 'Battle reference', '战斗说明', '戦闘の手引き')}</button></div><p class="tactical-plan" role="status">${t.hint}</p></section>`
}

/** Render the single set of combat actions for the fixed bottom dock. */
export function tacticalControlsTemplate(language: Language, run: Expedition): string {
  const encounter = run.encounter
  if (!encounter || run.phase !== 'boss') return ''
  const strike = tacticalCellAction(run, encounter.boss)
  const strikeLabel =
    strike.type === 'interact'
      ? battleText(language, 'Prime core · 1 AP', '启动核心 · 1 点', 'コア起動 · 1')
      : null
  const t = tacticalCopy(language, encounter.kind)
  return `<div class="tactical-controls">${encounter.kind === 'mirror' ? `<button class="dock-slot" data-control="shift" ${tacticalPlan(run, { type: 'shift' }).allowed ? '' : 'disabled'}>${spriteImage('mirror-rift')}${battleText(language, 'Shift realm · 1 AP', '切换镜域 · 1 点', '鏡界転移 · 1')}</button>` : ''}<button class="dock-slot" data-control="attack" ${tacticalPlan(run, strike).allowed ? '' : 'disabled'}>${spriteImage('bastion-strike')}${strikeLabel ?? t.attack}</button><button class="dock-slot" data-control="brace" ${tacticalPlan(run, { type: 'brace' }).allowed ? '' : 'disabled'}>${spriteImage('shield')}${t.brace}</button><button class="dock-slot primary-button" data-control="end-turn">${spriteImage('bastion-intent')}<strong>${t.end}</strong><small>${battleText(language, `${encounter.points} AP left`, `剩余 ${encounter.points} 点`, `残り ${encounter.points}`)}</small></button></div>`
}
