import { neighbors } from './engine.js'
import { placedBoard, shuffled, adjacentSteps } from './variant-board.js'
import { encounterTier } from './encounter-tiers.js'
import { openArena } from './arena-terrain.js'
import { deduceMines } from './mine-deduction.js'
import { combatStats } from './combat-build.js'
import { bastionIntent } from './tactical-intents.js'
import { forecastBrood } from './brood-turns.js'
import type { Config, Game } from '../types/game.js'
import type { Expedition } from '../types/variants.js'
import type { EncounterKind } from '../types/tactical.js'
import type { BattleLayout } from '../types/combat-build.js'

/** Flood only justified safe cells reachable from the current public opening. */
export function solveBattle(game: Game, walls: readonly number[], entrance: number): Game {
  let current = game
  const safe = new Set<number>()
  for (let pass = 0; pass < game.cells.length; pass++) {
    const deductions = deduceMines(current, walls)
    for (const index of deductions.safe) safe.add(index)
    const cells = current.cells.map((cell, index) =>
      deductions.mines.includes(index) ? { ...cell, visibility: 'flagged' as const } : cell,
    )
    const reachable = publicFloor({ ...current, cells }, walls, entrance)
    const ready = [...safe].filter(
      (index) =>
        cells[index]?.visibility === 'hidden' &&
        adjacentSteps(current, index).some((other) => reachable.has(other)),
    )
    if (deductions.mines.length === 0 && ready.length === 0) return current
    const seeds = new Set(ready)
    current = openArena(
      { ...current, cells },
      walls,
      new Set(
        cells.flatMap((cell, index) =>
          cell.visibility !== 'revealed' && !seeds.has(index) ? [index] : [],
        ),
      ),
    )
    // Retain flags established by logical deduction after the reveal flood.
    current = {
      ...current,
      cells: current.cells.map((cell, index) =>
        cells[index]?.visibility === 'flagged' ? { ...cell, visibility: 'flagged' } : cell,
      ),
    }
  }
  return current
}

/** Find connected revealed terrain without inspecting a covered cell's hidden contents. */
function publicFloor(game: Game, walls: readonly number[], entrance: number): Set<number> {
  const found = new Set([entrance])
  const queue = [entrance]
  for (const index of queue)
    for (const next of adjacentSteps(game, index)) {
      if (
        !found.has(next) &&
        !walls.includes(next) &&
        game.cells[next]?.visibility === 'revealed'
      ) {
        found.add(next)
        queue.push(next)
      }
    }
  return found
}

/** Reject guesses and bypass openings during generation; the solver uses the player's clues. */
function candidate(config: Config, seed: number, count: number): BattleLayout | null {
  const indices = Array.from({ length: config.width * config.height }, (_, index) => index)
  const entrance = shuffled(
    indices.filter((index) => {
      const x = index % config.width
      const y = Math.floor(index / config.width)
      return (
        (x === 1 || x === config.width - 2 || y === 1 || y === config.height - 2) &&
        x > 0 &&
        x < config.width - 1 &&
        y > 0 &&
        y < config.height - 1
      )
    }),
    seed,
  )[0]!
  const opening = new Set([entrance, ...neighbors(config, entrance)])
  const mines = new Set(
    shuffled(
      indices.filter((index) => !opening.has(index)),
      seed ^ 0x26d91,
    ).slice(0, config.mines),
  )
  const placed = placedBoard(config, mines, seed, entrance)
  const distance = new Map([[entrance, 0]])
  const queue = [entrance]
  for (const index of queue)
    for (const next of adjacentSteps(placed, index)) {
      if (!distance.has(next) && !mines.has(next)) {
        distance.set(next, distance.get(index)! + 1)
        queue.push(next)
      }
    }
  const far = Math.max(...distance.values())
  const boss = shuffled(
    [...distance.keys()].filter(
      (index) =>
        distance.get(index)! >= far - 3 &&
        placed.cells[index]?.visibility === 'hidden' &&
        adjacentSteps(placed, index).filter((other) => !mines.has(other)).length >= 3,
    ),
    seed ^ 0xb055,
  )[0]
  if (boss === undefined) return null
  const walls = indices.filter((index) => !mines.has(index) && !distance.has(index))
  walls.push(boss)
  const game = {
    ...placed,
    cells: placed.cells.map((cell, index) =>
      walls.includes(index) ? { ...cell, visibility: 'hidden' as const } : cell,
    ),
  }
  if (game.cells.filter((cell) => cell.visibility === 'revealed').length > game.cells.length * 0.48)
    return null
  const solved = solveBattle(game, walls, entrance)
  const reached = publicFloor(solved, walls, entrance)
  if (game.cells.some((cell, index) => !cell.mine && !walls.includes(index) && !reached.has(index)))
    return null
  const candidates = shuffled(
    indices.filter((index) => {
      const cell = game.cells[index]!
      return (
        !cell.mine &&
        !walls.includes(index) &&
        cell.visibility === 'hidden' &&
        cell.adjacent > 0 &&
        distance.get(index)! >= 4 &&
        !adjacentSteps(game, boss).includes(index)
      )
    }),
    seed ^ 0xc017,
  )
  const objectives: number[] = []
  for (const index of candidates) {
    if (
      objectives.every(
        (other) =>
          Math.abs((index % config.width) - (other % config.width)) +
            Math.abs(Math.floor(index / config.width) - Math.floor(other / config.width)) >=
          4,
      )
    )
      objectives.push(index)
    if (objectives.length === count) break
  }
  if (objectives.length !== count) return null
  return { game, walls, entrance, boss, objectives }
}

/** Exact shuffled mine counts scale by tier; a fixed fallback sequence keeps generation bounded. */
export function generateBattle(config: Config, seed: number, count: number): BattleLayout {
  for (let attempt = 0; attempt < 256; attempt++) {
    // The second half uses an independently verified fallback sequence for every supported tier.
    const base = attempt < 128 ? seed : 0x51afe
    const layout = candidate(config, (base + Math.imul(attempt % 128, 0x45d9f3b)) >>> 0, count)
    if (layout) return layout
  }
  throw new Error('No verified tactical layout for the supported tier')
}

/** Replace the room while preserving tools, health and all previously spent floor effects. */
export function enterBattle(run: Expedition, kind: EncounterKind): Expedition {
  const tier = encounterTier(run.departure.difficulty)
  const area = tier.config.width * tier.config.height
  const config = { ...tier.config, mines: Math.round(area * 0.17) }
  const layout = generateBattle(
    config,
    (run.departure.seed ^ Math.imul(run.floor, 0x85ebca6b)) >>> 0,
    kind === 'brood' ? 3 : 2,
  )
  const health = 20 + tier.health * 2
  const base = {
    priorDiscoveries: run.confirmedMines.length,
    boss: layout.boss,
    health,
    maxHealth: health,
    lastDamage: 0,
    turn: 1,
    points: combatStats(run).actions,
    braced: false,
    turnTriggers: [],
    event: 'entered' as const,
  }
  const result: Expedition = {
    ...run,
    game: layout.game,
    walls: layout.walls,
    entrance: layout.entrance,
    exit: layout.boss,
    player: layout.entrance,
    travelled: [layout.entrance],
    priorTravel: run.priorTravel + Math.max(0, run.travelled.length - 1),
    treasures: [],
    collected: [],
    scannedRows: [],
    confirmedMines: [],
    surveyedCells: [],
    probeReport: null,
    phase: 'boss',
    encounter:
      kind === 'bastion'
        ? {
            ...base,
            kind,
            pylons: layout.objectives.map((index) => ({ index, active: true })),
            mechanisms: layout.objectives.map((index, order) => ({
              index,
              active: true,
              effect: order === 0 ? 'weaken' : 'extend',
            })),
            exposedUntil: 0,
            intent: {
              ...bastionIntent(config, layout.walls, layout.boss, layout.entrance, 1),
              damage: 5,
            },
          }
        : {
            ...base,
            kind,
            nests: layout.objectives,
            destroyedNests: [],
            webs: shuffled(
              layout.game.cells.flatMap((cell, index) =>
                cell.visibility === 'revealed' && cell.adjacent > 0 && index !== layout.entrance
                  ? [index]
                  : [],
              ),
              run.departure.seed ^ 0x5eb,
            ).slice(0, 2),
            eggs: [],
            hatchlings: [],
            orders: [],
            queenTargets: [],
            intent: { kind: 'swarm', targets: [], damage: 5 },
          },
  }
  return kind === 'brood' ? forecastBrood(result) : result
}
