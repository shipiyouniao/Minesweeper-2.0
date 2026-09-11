import { battleThreat } from './combat-build.js'
import { tacticalPlan } from './tactical-planning.js'
import type { BattleLesson } from '../types/battle-lesson.js'
import type { Expedition, ExpeditionAction } from '../types/variants.js'

/** Persist only known teaching stages; absent or malformed progress starts at the introduction. */
export function parseBattleLesson(value: string | null): BattleLesson {
  switch (value) {
    case 'move':
    case 'turn':
    case 'combat':
    case 'attack':
    case 'done':
      return value
    default:
      return 'points'
  }
}

/** Recommend a reachable revealed square outside every currently announced attack. */
export function lessonTurnSafe(run: Expedition, index = run.player): boolean {
  const encounter = run.encounter
  if (!encounter) return false
  // A field may move the pawn and a tide may move terrain: do not promise a safe stationary turn.
  if (encounter.kind === 'magnetic' && encounter.forecast.kind !== 'charge') return false
  if (encounter.kind === 'tide' && encounter.turn % 3 === 0) return false
  return battleThreat(encounter, index, run.game.config) === 0
}

/** Recommend a reachable revealed square outside every currently announced attack. */
export function lessonSafeMove(run: Expedition): number | null {
  const encounter = run.encounter
  if (!encounter) return null
  const choices = run.game.cells.flatMap((cell, index) => {
    if (index === run.player || cell.visibility !== 'revealed' || !lessonTurnSafe(run, index))
      return []
    const plan = tacticalPlan(run, { type: 'move', index })
    return plan.allowed ? [{ index, cost: plan.cost }] : []
  })
  choices.sort((a, b) => a.cost - b.cost || a.index - b.index)
  return choices[0]?.index ?? null
}

/** Actual accepted inputs advance the coach equally for mouse, touch and keyboard. */
export function advanceBattleLesson(
  step: BattleLesson,
  before: Expedition,
  after: Expedition,
  action: ExpeditionAction,
): BattleLesson {
  if (!before.encounter || before === after) return step
  if (after.phase === 'won' || after.phase === 'reward') return 'done'
  if (step === 'move' && before.player !== after.player) return 'turn'
  if (step === 'turn' && action.type === 'end-turn') return 'combat'
  if (
    step === 'attack' &&
    action.type === 'attack' &&
    (!after.encounter || after.encounter.health < before.encounter.health)
  )
    return 'done'
  return step
}
