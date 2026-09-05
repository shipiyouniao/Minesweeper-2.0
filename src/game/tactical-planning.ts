import { approachPath, walkingPath } from './dungeon-path.js'
import { adjacentSteps } from './variant-board.js'
import { neighbors } from './engine.js'
import { walkingPointCost } from './combat-relics.js'
import { occupied } from './dungeon-occupancy.js'
import { hasCombatBuild } from './combat-build.js'
import type { Expedition, ExpeditionAction } from '../types/variants.js'
import type { TacticalPlan, TacticalReason } from '../types/tactical.js'

/** Use only public state when choosing whether a cell click means movement, a control, or attack. */
export function tacticalCellAction(run: Expedition, index: number): ExpeditionAction {
  const encounter = run.encounter
  if (hasCombatBuild(run.departure) && encounter) {
    if (
      encounter.kind === 'bastion' &&
      encounter.pylons.some((pylon) => pylon.index === index && pylon.active)
    ) {
      if (run.game.cells[index]?.visibility !== 'revealed') return { type: 'reveal', index }
      if (run.player === index || adjacentSteps(run.game, run.player).includes(index))
        return { type: 'interact', index }
    }
    if (
      encounter.kind === 'bastion' &&
      index === encounter.boss &&
      !encounter.pylons.some((pylon) => pylon.active) &&
      (encounter.exposedUntil ?? 0) < encounter.turn
    )
      return { type: 'interact', index }
    if (
      encounter.kind === 'brood' &&
      encounter.nests.includes(index) &&
      run.game.cells[index]?.visibility === 'revealed' &&
      (run.player === index || adjacentSteps(run.game, run.player).includes(index))
    )
      return { type: 'interact', index }
  }
  if (run.encounter?.boss === index) return { type: 'attack' }
  if (
    ((run.encounter?.kind === 'bastion' &&
      run.encounter.pylons.some((pylon) => pylon.index === index && pylon.active)) ||
      (run.encounter?.kind === 'brood' && occupied(run, index) && !run.walls.includes(index))) &&
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
        if (action.type === 'move') cost = walkingPointCost(run, route.length - 1)
      }
      break
    }
    case 'attack':
      cost = 2
      if (encounter.kind === 'bastion' && encounter.pylons.some((pylon) => pylon.active))
        reason = 'armor'
      else if (
        hasCombatBuild(run.departure) &&
        encounter.kind === 'bastion' &&
        (encounter.exposedUntil ?? 0) < encounter.turn
      )
        reason = 'window'
      else if (
        hasCombatBuild(run.departure) &&
        encounter.kind === 'brood' &&
        encounter.nests.length === 3
      )
        reason = 'nests'
      else if (!adjacentSteps(run.game, run.player).includes(encounter.boss)) reason = 'adjacent'
      break
    case 'interact': {
      if (hasCombatBuild(run.departure)) {
        const core = encounter.kind === 'bastion' && action.index === encounter.boss
        const objective =
          encounter.kind === 'bastion'
            ? encounter.pylons.some((pylon) => pylon.index === action.index && pylon.active)
            : encounter.nests.includes(action.index)
        if (core) {
          if (encounter.pylons.some((pylon) => pylon.active)) reason = 'armor'
          else if ((encounter.exposedUntil ?? 0) >= encounter.turn) reason = 'used'
          else if (!adjacentSteps(run.game, run.player).includes(action.index)) reason = 'adjacent'
          break
        }
        if (objective) {
          if (run.game.cells[action.index]?.visibility !== 'revealed') reason = 'path'
          else if (
            run.player !== action.index &&
            !adjacentSteps(run.game, run.player).includes(action.index)
          )
            reason = 'adjacent'
          else if (
            neighbors(run.game.config, action.index).filter(
              (index) => run.game.cells[index]?.visibility === 'flagged',
            ).length !== run.game.cells[action.index]?.adjacent
          )
            reason = 'flags'
          break
        }
      }
      if (encounter.kind === 'brood') {
        if (!occupied(run, action.index) || run.walls.includes(action.index)) reason = 'used'
        else if (!adjacentSteps(run.game, run.player).includes(action.index)) reason = 'adjacent'
        break
      }
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
