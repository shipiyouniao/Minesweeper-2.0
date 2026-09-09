import assert from 'node:assert/strict'
import { actExpedition } from '../src/game/expedition.js'
import { deduceMines } from '../src/game/mine-deduction.js'
import { adjacentSteps } from '../src/game/variant-board.js'
import { tacticalPlan } from '../src/game/tactical-planning.js'
import { anchorArea } from '../src/game/tide-shuffle.js'
import type { Expedition, ExpeditionAction } from '../src/types/variants.js'

/** Plan through revealed or logically safe terrain without reading hidden mine identities. */
function route(run: Expedition, safe: ReadonlySet<number>, targets: readonly number[]): number[] {
  const paths = [[run.player]]
  const seen = new Set([run.player])
  for (const path of paths) {
    const index = path.at(-1)!
    if (targets.includes(index)) return path
    for (const next of adjacentSteps(run.game, index)) {
      if (
        seen.has(next) ||
        run.walls.includes(next) ||
        run.game.cells[next]!.visibility === 'flagged'
      )
        continue
      if (run.game.cells[next]!.visibility !== 'revealed' && !safe.has(next)) continue
      seen.add(next)
      paths.push([...path, next])
    }
  }
  return []
}

/** A public-clue explorer reserves its last point to leave the frozen wave forecast. */
export function defeatTide(initial: Expedition): ExpeditionAction[] {
  let run = initial
  const actions: ExpeditionAction[] = []
  let knownSafe = new Set<number>()
  let cycle = -1
  /** Record only accepted actions, using the same domain boundary as the UI and journal. */
  function act(action: ExpeditionAction): boolean {
    const next = actExpedition(run, action)
    if (next === run) return false
    actions.push(action)
    run = next
    return true
  }
  for (let turn = 0; turn < 180 && run.phase === 'boss'; turn++) {
    assert.ok(run.encounter?.kind === 'tide')
    if (cycle !== run.encounter.cycle) {
      knownSafe = new Set(
        [...knownSafe].map((index) =>
          run.encounter?.kind === 'tide' ? (run.encounter.permutation[index] ?? index) : index,
        ),
      )
      cycle = run.encounter.cycle
    }
    knownSafe.add(run.encounter.core)
    for (let actionCount = 0; actionCount < 12 && run.phase === 'boss'; actionCount++) {
      assert.ok(run.encounter?.kind === 'tide')
      for (let pass = 0; pass < run.game.cells.length; pass++) {
        const deduction = deduceMines(run.game, run.walls)
        for (const index of deduction.safe) knownSafe.add(index)
        if (!deduction.mines.length) break
        for (const index of deduction.mines) act({ type: 'flag', index })
      }
      const e = run.encounter
      const danger = e.intent.targets.includes(run.player)
      if (e.points <= Number(danger)) break
      const attack: ExpeditionAction = { type: 'attack' }
      if (tacticalPlan(run, attack).allowed && e.points >= 2 + Number(danger)) {
        act(attack)
        continue
      }
      if (
        !e.exposed &&
        !e.anchors.some((index) => anchorArea(run.game.config, index).includes(e.core)) &&
        run.game.cells[e.core]!.visibility === 'revealed'
      ) {
        const center = [run.player, ...adjacentSteps(run.game, run.player)].find(
          (index) =>
            anchorArea(run.game.config, index).includes(e.core) &&
            tacticalPlan(run, { type: 'anchor', index }).allowed,
        )
        if (center !== undefined && act({ type: 'anchor', index: center })) continue
      }
      const targets = e.exposed ? adjacentSteps(run.game, e.boss) : [e.core]
      let path = route(run, knownSafe, targets)
      if (!path.length) {
        const hidden = [...knownSafe].filter(
          (index) => run.game.cells[index]!.visibility === 'hidden',
        )
        path = route(run, knownSafe, hidden)
      }
      const index = path[1]
      if (index === undefined) break
      const action: ExpeditionAction = {
        type: run.game.cells[index]!.visibility === 'revealed' ? 'move' : 'reveal',
        index,
      }
      if (!act(action)) break
    }
    if (run.phase !== 'boss') break
    assert.ok(run.encounter?.kind === 'tide')
    const intent = run.encounter.intent
    if (intent.targets.includes(run.player)) {
      const exit = adjacentSteps(run.game, run.player).find(
        (index) =>
          !intent.targets.includes(index) && tacticalPlan(run, { type: 'move', index }).allowed,
      )
      if (exit !== undefined) act({ type: 'move', index: exit })
      else if (tacticalPlan(run, { type: 'brace' }).allowed) act({ type: 'brace' })
    }
    act({ type: 'end-turn' })
  }
  assert.ok(
    run.phase === 'reward' || run.phase === 'won',
    `Tide trial ended ${run.phase}, HP ${run.health}, boss ${run.encounter?.health}, turn ${run.encounter?.turn}`,
  )
  return actions
}
