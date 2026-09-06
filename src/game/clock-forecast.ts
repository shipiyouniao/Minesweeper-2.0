import { adjacentSteps } from './variant-board.js'
import { walkingNeighbors } from './mobility-skills.js'
import { occupied } from './dungeon-occupancy.js'
import { combatStats } from './combat-build.js'
import type { ClockExpedition, ClockSpell } from '../types/clock.js'

/** Time-expanded reachability: walking costs one AP and hazards resolve only at turn ends.
 * Ignoring optional discounts/refunds is conservative and never relies on hidden cells or tools.
 */
export function clockEscapeExists(run: ClockExpedition, spells = run.encounter.spells): boolean {
  let positions = new Set([run.player])
  const last = Math.max(run.encounter.turn, ...spells.map((spell) => spell.resolvesOn))
  for (let turn = run.encounter.turn; turn <= last; turn++) {
    const budget =
      turn === run.encounter.turn
        ? run.encounter.points
        : combatStats({ ...run, encounter: { ...run.encounter, turn } }).actions
    for (let step = 0; step < budget; step++) {
      const expanded = new Set(positions)
      for (const index of positions)
        for (const other of walkingNeighbors(run, index)) {
          if (!occupied(run, other) && run.game.cells[other]?.visibility === 'revealed')
            expanded.add(other)
        }
      positions = expanded
    }
    const danger = new Set(
      spells
        .filter((spell) => !spell.redirected && spell.resolvesOn === turn)
        .flatMap((spell) => [...spell.targets]),
    )
    positions = new Set([...positions].filter((index) => !danger.has(index)))
    if (!positions.size) return false
  }
  return true
}

/** Shared intent contains only attacks due this turn, including additive overlap in battleThreat. */
export function clockIntent(run: ClockExpedition): ClockExpedition {
  const targets = [
    ...new Set(
      run.encounter.spells
        .filter((spell) => !spell.redirected && spell.resolvesOn === run.encounter.turn)
        .flatMap((spell) => [...spell.targets]),
    ),
  ]
  return { ...run, encounter: { ...run.encounter, intent: { kind: 'cross', targets, damage: 3 } } }
}

/** Publish new immutable forecasts only at turn start, shrinking a candidate if escape is blocked. */
export function forecastClock(run: ClockExpedition): ClockExpedition {
  const e = run.encounter
  let spells = [...e.spells],
    nextSpell = e.nextSpell
  if (e.recoveryUntil < e.turn && e.turn % 2 === 1) {
    const { width } = run.game.config
    const shapes: ClockSpell['shape'][] =
      e.health <= e.maxHealth / 2 ? ['cross', 'line'] : ['cross']
    for (const shape of shapes) {
      const targets =
        shape === 'cross'
          ? [run.player, ...adjacentSteps(run.game, run.player)]
          : run.game.cells.flatMap((_, index) =>
              (
                e.turn % 4 === 1
                  ? Math.floor(index / width) === Math.floor(run.player / width)
                  : index % width === run.player % width
              )
                ? [index]
                : [],
            )
      for (const footprint of [targets, [run.player]]) {
        const spell: ClockSpell = {
          id: nextSpell,
          shape,
          targets: footprint,
          resolvesOn: e.turn + (shape === 'line' ? 2 : 1),
          redirected: false,
        }
        if (!clockEscapeExists(run, [...spells, spell])) continue
        spells.push(spell)
        nextSpell++
        break
      }
    }
  }
  return clockIntent({ ...run, encounter: { ...e, spells, nextSpell } })
}
