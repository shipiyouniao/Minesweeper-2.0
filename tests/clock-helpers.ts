import assert from 'node:assert/strict'
import { actExpedition, frontierCells } from '../src/game/expedition.js'
import { deduceMines } from '../src/game/mine-deduction.js'
import { walkingPath, approachPath } from '../src/game/dungeon-path.js'
import { tacticalPlan } from '../src/game/tactical-planning.js'
import { clockEscapeExists } from '../src/game/clock-forecast.js'
import { battleThreat } from '../src/game/combat-build.js'
import { adjacentSteps } from '../src/game/variant-board.js'
import type { Expedition, ExpeditionAction } from '../src/types/variants.js'
import type { BattleTestPlan } from './battle-types.js'

/** Public-clue player proves wins without tools, skills or patched state; an hourglass breaks the barrier. */
export function defeatClock(initial: Expedition): ExpeditionAction[] {
  let run = initial
  const transcript: ExpeditionAction[] = [],
    safe = new Set<number>()
  for (let round = 0; round < 500 && run.phase === 'boss'; round++) {
    assert.ok(run.encounter?.kind === 'clock')
    for (let pass = 0; pass < run.game.cells.length; pass++) {
      const deduction = deduceMines(run.game, run.walls)
      for (const index of deduction.safe) safe.add(index)
      if (!deduction.mines.length) break
      for (const index of deduction.mines) {
        const action: ExpeditionAction = { type: 'flag', index }
        run = actExpedition(run, action)
        transcript.push(action)
      }
    }
    assert.ok(run.encounter?.kind === 'clock')
    const sealed = !run.encounter.hourglasses.some((glass) => glass.used)
    for (const glass of run.encounter.hourglasses) safe.add(glass.index)
    const boss = sealed ? run.encounter.hourglasses[0]!.index : run.encounter.boss
    const goals = adjacentSteps(run.game, boss).filter((index) => walkingPath(run, index))
    const frontier = [...frontierCells(run)].filter((index) => safe.has(index))
    const target =
      sealed && approachPath(run, boss)
        ? boss
        : goals.length
          ? goals.sort((a, b) => walkingPath(run, a)!.length - walkingPath(run, b)!.length)[0]
          : frontier.sort((a, b) => approachPath(run, a)!.length - approachPath(run, b)!.length)[0]
    assert.notEqual(target, undefined, 'Deduction must expose an approach to the clock mage')
    const score = (state: Expedition): number => {
      if (state.phase === 'reward' || state.phase === 'won') return 1e6
      const distance = target === undefined ? 0 : (approachPath(state, target)?.length ?? 500)
      return (
        (state.encounter?.kind === 'clock' &&
        state.encounter.hourglasses.some((glass) => glass.used)
          ? 10000
          : 0) -
        state.encounter!.health * 100 +
        state.game.cells.filter((cell) => cell.visibility === 'revealed').length * 8 -
        distance * 3
      )
    }
    let beam: BattleTestPlan[] = [{ run, actions: [] }],
      best: BattleTestPlan | null = null
    for (let depth = 0; depth <= 5; depth++) {
      const candidates: BattleTestPlan[] = [],
        seen = new Set<string>()
      for (const plan of beam) {
        const state = plan.run
        if (state.phase !== 'boss') {
          best = plan
          break
        }
        assert.ok(state.encounter?.kind === 'clock')
        if (battleThreat(state.encounter, state.player, state.game.config) === 0) {
          const ended = actExpedition(state, { type: 'end-turn' })
          if (!best || score(ended) > score(best.run))
            best = { run: ended, actions: [...plan.actions, { type: 'end-turn' }] }
        }
        const choices: ExpeditionAction[] = [
          { type: 'attack' },
          ...state.encounter.hourglasses.map((glass) => ({
            type: 'interact' as const,
            index: glass.index,
          })),
        ]
        for (const index of adjacentSteps(state.game, state.player)) {
          if (state.game.cells[index]?.visibility === 'revealed')
            choices.push({ type: 'move', index })
          else if (safe.has(index)) choices.push({ type: 'reveal', index })
        }
        for (const action of choices) {
          if (!tacticalPlan(state, action).allowed) continue
          const next = actExpedition(state, action)
          if (next === state) continue
          if (
            next.phase === 'boss' &&
            next.encounter?.kind === 'clock' &&
            !clockEscapeExists({ ...next, encounter: next.encounter })
          )
            continue
          const identity = JSON.stringify([
            next.player,
            next.encounter?.points,
            next.encounter?.health,
            next.encounter?.kind === 'clock'
              ? next.encounter.hourglasses.map((glass) => glass.used)
              : [],
            next.game.cells.map((cell) => cell.visibility),
          ])
          if (seen.has(identity)) continue
          seen.add(identity)
          candidates.push({ run: next, actions: [...plan.actions, action] })
        }
      }
      if (best?.run.phase === 'reward' || best?.run.phase === 'won') break
      beam = candidates.sort((a, b) => score(b.run) - score(a.run)).slice(0, 20)
    }
    assert.ok(best, `No safe clock plan on turn ${round}`)
    assert.equal(best.run.health, run.health, 'Public baseline should avoid all clock damage')
    transcript.push(...best.actions)
    run = best.run
  }
  assert.ok(
    run.phase === 'reward' || run.phase === 'won',
    `Clock battle stalled: ${JSON.stringify(run.encounter)}`,
  )
  return transcript
}
