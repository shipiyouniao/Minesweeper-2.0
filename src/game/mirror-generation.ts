import { neighbors } from './engine.js'
import { adjacentSteps, placedBoard, shuffled } from './variant-board.js'
import { deduceMines } from './mine-deduction.js'
import { openArena } from './arena-terrain.js'
import type { Config, Game } from '../types/game.js'
import type { MirrorLayout, MirrorRoom, MirrorSolution } from '../types/mirror.js'

/** Find an orthogonally connected component, either during generation or from public clues. */
function connected(
  game: Game,
  entrance: number,
  walls: readonly number[],
  revealed: boolean,
): Set<number> {
  const reached = new Set([entrance])
  const queue = [entrance]
  for (const index of queue) {
    for (const next of adjacentSteps(game, index)) {
      const cell = game.cells[next]!
      if (reached.has(next) || walls.includes(next)) continue
      if (revealed ? cell.visibility !== 'revealed' : cell.mine) continue
      reached.add(next)
      queue.push(next)
    }
  }
  return reached
}

/** Advance only justified frontier cells; opposite flags here come exclusively from deduction. */
function solveRoom(room: MirrorRoom, game: Game, partner: Game, entrance: number): Game {
  const deductions = deduceMines(game, room.walls)
  const safe = new Set([
    ...deductions.safe,
    ...partner.cells.flatMap((cell, index) => (cell.visibility === 'flagged' ? [index] : [])),
  ])
  const cells = game.cells.map((cell, index) =>
    deductions.mines.includes(index) ? { ...cell, visibility: 'flagged' as const } : cell,
  )
  const reached = connected({ ...game, cells }, entrance, room.walls, true)
  const seeds = new Set(
    cells.flatMap((cell, index) =>
      cell.visibility === 'hidden' &&
      safe.has(index) &&
      adjacentSteps(game, index).some((next) => reached.has(next))
        ? [index]
        : [],
    ),
  )
  if (!seeds.size && !deductions.mines.length) return game

  const opened = openArena(
    { ...game, cells },
    room.walls,
    new Set(
      cells.flatMap((cell, index) =>
        cell.visibility !== 'revealed' && !seeds.has(index) ? [index] : [],
      ),
    ),
  )
  return {
    ...opened,
    cells: opened.cells.map((cell, index) =>
      cells[index]?.visibility === 'flagged' ? { ...cell, visibility: 'flagged' } : cell,
    ),
  }
}

/** Verify joint solvability using visible clues and the published mine-exclusion rule only. */
export function solveMirror(layout: MirrorLayout): MirrorSolution {
  let dawn = layout.dawn.game
  let dusk = layout.dusk.game
  for (let pass = 0; pass < dawn.cells.length * 2; pass++) {
    const nextDawn = solveRoom(layout.dawn, dawn, dusk, layout.entrance)
    const nextDusk = solveRoom(layout.dusk, dusk, nextDawn, layout.entrance)
    if (nextDawn === dawn && nextDusk === dusk) break
    dawn = nextDawn
    dusk = nextDusk
  }
  return { dawn, dusk }
}

/** Convert unreachable safe terrain into walls, then open the full entrance zero component. */
function createRoom(game: Game, entrance: number, boss: number): MirrorRoom {
  const reached = connected(game, entrance, [boss], false)
  const walls = game.cells.flatMap((cell, index) =>
    !cell.mine && !reached.has(index) ? [index] : [],
  )
  return {
    game: openArena(
      game,
      walls,
      new Set(game.cells.flatMap((_, index) => (index !== entrance ? [index] : []))),
    ),
    walls,
    player: entrance,
    travelled: [entrance],
    confirmedMines: [],
    triggeredMines: [],
    surveyedCells: [],
    scannedRows: [],
    probeReport: null,
  }
}

/** Select a covered numbered seal away from the opening and the boss's attack positions. */
function sealIndex(room: MirrorRoom, entrance: number, boss: number, seed: number): number | null {
  const width = room.game.config.width
  const candidates = room.game.cells.flatMap((cell, index) => {
    const distance =
      Math.abs((index % width) - (entrance % width)) +
      Math.abs(Math.floor(index / width) - Math.floor(entrance / width))
    return !cell.mine &&
      cell.adjacent > 0 &&
      cell.visibility === 'hidden' &&
      !room.walls.includes(index) &&
      distance >= 4 &&
      !adjacentSteps(room.game, boss).includes(index)
      ? [index]
      : []
  })
  return shuffled(candidates, seed)[0] ?? null
}

/** Partition a single shuffled pool into exact, disjoint mine sets before choosing landmarks. */
function candidate(config: Config, seed: number): MirrorLayout | null {
  const indices = Array.from({ length: config.width * config.height }, (_, index) => index)
  const entrance = shuffled(
    indices.filter((index) => {
      const x = index % config.width
      const y = Math.floor(index / config.width)
      return (
        x > 0 &&
        x < config.width - 1 &&
        y > 0 &&
        y < config.height - 1 &&
        (x === 1 || x === config.width - 2 || y === 1 || y === config.height - 2)
      )
    }),
    seed,
  )[0]!
  const opening = new Set([entrance, ...neighbors(config, entrance)])
  const pool = shuffled(
    indices.filter((index) => !opening.has(index)),
    seed ^ 0x26d91,
  )
  const dawnGame = placedBoard(config, new Set(pool.slice(0, config.mines)), seed, entrance)
  const duskGame = placedBoard(
    config,
    new Set(pool.slice(config.mines, config.mines * 2)),
    seed ^ 0x717,
    entrance,
  )
  const width = config.width
  const bosses = shuffled(
    indices.filter((index) => {
      const distance =
        Math.abs((index % width) - (entrance % width)) +
        Math.abs(Math.floor(index / width) - Math.floor(entrance / width))
      return (
        !dawnGame.cells[index]!.mine &&
        !duskGame.cells[index]!.mine &&
        distance >= width - 2 &&
        dawnGame.cells[index]!.visibility === 'hidden' &&
        duskGame.cells[index]!.visibility === 'hidden' &&
        adjacentSteps(dawnGame, index).filter(
          (other) => !dawnGame.cells[other]!.mine && !duskGame.cells[other]!.mine,
        ).length >= 2
      )
    }),
    seed ^ 0xb055,
  )
  const boss = bosses[0]
  if (boss === undefined) return null
  const dawn = createRoom(dawnGame, entrance, boss)
  const dusk = createRoom(duskGame, entrance, boss)
  if (
    [dawn, dusk].some(
      (room) =>
        room.game.cells.filter((cell) => cell.visibility === 'revealed').length >
          indices.length * 0.48 ||
        adjacentSteps(room.game, boss).filter(
          (index) => !room.walls.includes(index) && !room.game.cells[index]!.mine,
        ).length < 2,
    )
  )
    return null
  const dawnSeal = sealIndex(dawn, entrance, boss, seed ^ 0xada)
  const duskSeal = sealIndex(dusk, entrance, boss, seed ^ 0xbdb)
  if (dawnSeal === null || duskSeal === null) return null
  const layout = { dawn, dusk, entrance, boss, dawnSeal, duskSeal }
  const solved = solveMirror(layout)
  for (const side of ['dawn', 'dusk'] as const) {
    const reached = connected(solved[side], entrance, layout[side].walls, true)
    if (
      solved[side].cells.some(
        (cell, index) => !cell.mine && !layout[side].walls.includes(index) && !reached.has(index),
      )
    )
      return null
  }
  return layout
}

/** Bound generation and verify a deterministic fallback sequence for each supported arena size. */
export function generateMirror(config: Config, seed: number): MirrorLayout {
  for (let attempt = 0; attempt < 512; attempt++) {
    const base = attempt < 256 ? seed : 0x71a51
    const layout = candidate(config, (base + Math.imul(attempt % 256, 0x45d9f3b)) >>> 0)
    if (layout) return layout
  }
  throw new Error('No verified mirror layout for the supported tier')
}
