import { chordTargets } from './engine.js'
import { approachPath } from './dungeon-path.js'
import { occupied } from './dungeon-occupancy.js'
import { tacticalPlan } from './tactical-planning.js'
import type { Expedition } from '../types/variants.js'
import type { ExploreTransition } from '../types/tactical.js'

/** Price a normal reveal using known paths and the current turn's remaining points. */
function revealCost(run: Expedition, index: number): number {
  if (run.phase === 'boss') {
    const plan = tacticalPlan(run, { type: 'reveal', index })
    return plan.allowed ? plan.cost : Infinity
  }
  const path = approachPath(run, index)
  return path ? path.length : Infinity
}

/** Batch only the original number's neighbors, leaving unreachable hypotheses as notes. */
export function chordExpedition(
  run: Expedition,
  index: number,
  apply: ExploreTransition,
): Expedition {
  if ((run.phase !== 'exploring' && run.phase !== 'boss') || occupied(run, index)) return run
  const confirmedSafe = run.surveyedCells.filter((other) => !run.confirmedMines.includes(other))
  const targets = chordTargets(run.game, index, confirmedSafe).filter(
    (other) => !occupied(run, other),
  )
  if (!targets.length) return run

  const marks = targets.filter(
    (other) => !run.surveyedCells.includes(other) && !run.game.safeMarks.includes(other),
  )
  let next = marks.length
    ? { ...run, game: { ...run.game, safeMarks: [...run.game.safeMarks, ...marks] } }
    : run

  // Re-evaluate after each reveal: blank expansion can connect another target or clear its note.
  for (let count = 0; count < targets.length; count++) {
    const candidates = targets
      .filter((other) => next.game.cells[other]?.visibility === 'hidden')
      .map((other) => ({ index: other, cost: revealCost(next, other) }))
      .filter((candidate) => Number.isFinite(candidate.cost))
      .sort((a, b) => a.cost - b.cost || a.index - b.index)
    const target = candidates[0]
    if (!target) break

    const before = next
    next = apply(before, { type: 'reveal', index: target.index })
    if (
      next === before ||
      next.phase !== run.phase ||
      next.triggeredMines.length > before.triggeredMines.length
    )
      break
  }

  // Notes are a single accepted intent even if no physical reveal can be afforded.
  return next !== run && next.steps === run.steps ? { ...next, steps: next.steps + 1 } : next
}
