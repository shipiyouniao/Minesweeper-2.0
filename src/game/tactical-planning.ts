import { approachPath, walkingPath } from './dungeon-path.js'
import { adjacentSteps } from './variant-board.js'
import { neighbors } from './engine.js'
import type { Expedition, ExpeditionAction } from '../types/variants.js'
import type { TacticalPlan, TacticalReason } from '../types/tactical.js'

/** Use only public state when choosing whether a cell click means movement, a control, or attack. */
export function tacticalCellAction(run: Expedition, index: number): ExpeditionAction {
  if (run.encounter?.boss === index) return { type: 'attack' }
  if (
    run.encounter?.pylons.some((pylon) => pylon.index === index && pylon.active) &&
    adjacentSteps(run.game, run.player).includes(index)
  )
    return { type: 'interact', index }
  return { type: run.game.cells[index]?.visibility === 'revealed' ? 'move' : 'reveal', index }
}

/** Calculate action costs before animation; blocked destinations never move or advance the turn. */
export function tacticalPlan(run: Expedition, action: ExpeditionAction): TacticalPlan {
  const encounter = run.encounter
  if (!encounter || run.phase !== 'boss')
    return { path: [], cost: 0, allowed: false, reason: 'inactive' }
  let path: readonly number[] = []
  let cost = 1
  let reason: TacticalReason = 'ready'

  switch (action.type) {
    case 'move':
    case 'reveal': {
      const route =
        action.type === 'move' ? walkingPath(run, action.index) : approachPath(run, action.index)
      if (!route || (route.length === 1 && action.type === 'move')) reason = 'path'
      else {
        path = route
        cost = route.length - 1 + Number(action.type === 'reveal')
      }
      break
    }
    case 'attack':
      cost = 2
      if (encounter.pylons.some((pylon) => pylon.active)) reason = 'armor'
      else if (!adjacentSteps(run.game, run.player).includes(encounter.boss)) reason = 'adjacent'
      break
    case 'interact': {
      const pylon = encounter.pylons.find((entry) => entry.index === action.index && entry.active)
      if (!pylon) reason = 'used'
      else if (!adjacentSteps(run.game, run.player).includes(action.index)) reason = 'adjacent'
      else if (
        neighbors(run.game.config, action.index).filter(
          (index) => run.game.cells[index]?.visibility === 'flagged',
        ).length !== run.game.cells[action.index]?.adjacent
      )
        reason = 'flags'
      break
    }
    case 'brace':
      if (encounter.braced) reason = 'used'
      break
    case 'flag':
    case 'end-turn':
    case 'retreat':
      cost = 0
      break
    case 'descend':
    case 'relic':
      reason = 'inactive'
      break
  }

  if (reason === 'ready' && cost > encounter.points) reason = 'points'
  return { path, cost, allowed: reason === 'ready', reason }
}
