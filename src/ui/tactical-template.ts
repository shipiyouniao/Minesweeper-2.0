import { sharedStyles } from './shared-styles.js'
import { gameplayStyles } from './gameplay-styles.js'
import { combatStats } from '../game/combat-build.js'
import { message } from '../i18n.js'
import { battleStatus, combatStatsTemplate } from './battle-presentation.js'
import { clockQueue } from './clock-board.js'
import { mirrorHeader } from './mirror-template.js'

import { tacticalCellAction, tacticalPlan } from '../game/tactical-planning.js'
import type { Language } from '../types/localization.js'
import type { Expedition } from '../types/variants.js'
import { spriteImage } from './dungeon-sprites.js'
import { tacticalCopy, tacticalEventCopy, tacticalHint, tacticalPlanCopy } from './tactical-copy.js'
import { bossSprite } from './tactical-sprites.js'

/** Present the active boss's public state in the compact sidebar. */
export function tacticalTemplate(language: Language, run: Expedition): string {
  const encounter = run.encounter
  if (!encounter) return ''

  const t = tacticalCopy(language, encounter.kind)
  if (run.phase !== 'boss')
    return encounter.health === 0
      ? `<p class="tactical-victory ${gameplayStyles['tactical-victory']}">${t.victory}</p>`
      : ''

  const status = battleStatus(language, encounter)

  return `<section class="tactical-panel ${gameplayStyles['tactical-panel']}" aria-label="${t.name}">${encounter.kind === 'mirror' ? mirrorHeader(language, encounter) : `<div class="tactical-heading ${gameplayStyles['tactical-heading']}">${spriteImage(bossSprite(encounter))}<div><h3>${t.name}</h3><strong>${encounter.health} / ${encounter.maxHealth}</strong><p class="boss-status">${status}</p></div></div>`}
    <div class="tactical-counters ${gameplayStyles['tactical-counters']}"><span>${t.turn} <strong>${encounter.turn}</strong></span><span>${t.points} <strong class="tactical-points">${Math.min(combatStats(run).actions, encounter.points)} / ${combatStats(run).actions}${encounter.points > combatStats(run).actions ? ` (+${encounter.points - combatStats(run).actions})` : ''}</strong></span></div>
    ${combatStatsTemplate(language, run)}${clockQueue(language, run)}
    <p class="tactical-event ${gameplayStyles['tactical-event']}" role="status" tabindex="-1">${tacticalEventCopy(language, encounter)}</p>
    <div class="battle-reference-actions ${gameplayStyles['battle-reference-actions']}"><button class="text-button ${sharedStyles['text-button']} prologue-replay" data-control="prologue">${message(language, 'tactical-template.replay-arrival')}</button><button class="text-button ${sharedStyles['text-button']}" data-control="help">${message(language, 'tactical-template.battle-reference')}</button></div><p class="tactical-plan ${gameplayStyles['tactical-plan']}" role="status">${tacticalHint(language, run)}</p></section>`
}

/** Render the single set of combat actions for the fixed bottom dock. */
export function tacticalControlsTemplate(language: Language, run: Expedition): string {
  const encounter = run.encounter
  if (!encounter || run.phase !== 'boss') return ''

  const strike = tacticalCellAction(run, encounter.boss)
  const strikeLabel =
    strike.type === 'interact' ? message(language, 'tactical-template.prime-core-1-ap') : null
  const t = tacticalCopy(language, encounter.kind)
  const attuneBlocked = encounter.kind === 'matrix' && (encounter.exposed || encounter.points < 1)
  const attuneHint =
    encounter.kind === 'matrix' && encounter.exposed
      ? message(language, 'matrix.open-hint')
      : encounter.points < 1
        ? tacticalPlanCopy(language, { path: [], cost: 1, allowed: false, reason: 'points' })
        : message(language, 'matrix.attune-hint')
  const tideTool =
    encounter.kind === 'tide'
      ? `<button class="dock-slot inventory-tool ${sharedStyles['inventory-tool']}" data-control="anchor" data-tool="anchor" aria-pressed="false" ${encounter.points < 1 || encounter.anchors.length >= 2 ? 'disabled' : ''} title="${message(language, 'tide.anchor-hint')}">${spriteImage('tide-anchor')}${message(language, 'tide.anchor')}<span class="tool-count ${sharedStyles['tool-count']}">${2 - encounter.anchors.length}</span></button>`
      : ''
  const matrixTools =
    encounter.kind === 'matrix'
      ? `<button class="dock-slot" data-control="observe" aria-expanded="false" aria-controls="matrix-observation">${spriteImage('matrix-observe')}${message(language, 'matrix.observe')}</button><div class="dock-skill ${gameplayStyles['dock-skill']} tw:focus-within:[&_.skill-bubble]:block"><button class="dock-slot inventory-tool ${sharedStyles['inventory-tool']} tw:aria-disabled:opacity-45 tw:aria-disabled:grayscale tw:aria-disabled:cursor-default" aria-describedby="attune-tip" data-control="attune" data-tool="attune" aria-pressed="false" aria-disabled="${attuneBlocked}">${spriteImage('attune')}${message(language, 'matrix.attune')}</button><div id="attune-tip" role="tooltip" class="skill-bubble ${gameplayStyles['skill-bubble']}">${attuneHint}</div></div>`
      : ''

  return `<div class="tactical-controls ${gameplayStyles['tactical-controls']}">${tideTool}${matrixTools}${encounter.kind === 'mirror' ? `<button class="dock-slot" data-control="shift" ${tacticalPlan(run, { type: 'shift' }).allowed ? '' : 'disabled'}>${spriteImage('mirror-rift')}${message(language, 'tactical-template.shift-realm-1-ap')}</button>` : ''}<button class="dock-slot" data-control="attack" ${tacticalPlan(run, strike).allowed ? '' : 'disabled'}>${spriteImage('bastion-strike')}${strikeLabel ?? t.attack}</button><button class="dock-slot" data-control="brace" ${tacticalPlan(run, { type: 'brace' }).allowed ? '' : 'disabled'}>${spriteImage('shield')}${t.brace}</button><button class="dock-slot primary-button ${sharedStyles['primary-button']}" data-control="end-turn">${spriteImage('bastion-intent')}<strong>${t.end}</strong><small>${message(language, 'tactical-template.ap-left', { p0: encounter.points })}</small></button></div>`
}
