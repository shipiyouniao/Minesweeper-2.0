import { neighbors } from './engine.js'
import { adjacentSteps } from './variant-board.js'
import { PROLOGUE_SCENES } from './story-content.js'
import type { StoryAction, StoryBoard, StoryRun, StoryScene } from '../types/story.js'

/** Derive numbers from an explicit map; artwork and scripting never supply clue values. */
export function buildStoryBoard(scene: StoryScene): StoryBoard {
  const width = scene.rows[0]?.length ?? 0
  const symbols = scene.rows.join('')
  if (!width || scene.rows.some((row) => row.length !== width) || !/^[#*.oSET]+$/.test(symbols))
    throw new Error('Invalid authored scene: ' + scene.id)
  const entrance = symbols.indexOf('S')
  const exit = symbols.indexOf('E')
  if (entrance < 0 || exit < 0) throw new Error('Scene requires an entrance and exit')
  const config = {
    width,
    height: scene.rows.length,
    mines: [...symbols].filter((s) => s === '*').length,
  }
  return {
    scene,
    entrance,
    exit,
    treasure: symbols.includes('T') ? symbols.indexOf('T') : null,
    walls: [...symbols].flatMap((s, index) => (s === '#' ? [index] : [])),
    game: {
      config,
      seed: 0,
      firstClick: entrance,
      phase: 'playing',
      safeMarks: [],
      exploded: null,
      cells: [...symbols].map((s, index) => ({
        mine: s === '*',
        adjacent: neighbors(config, index).filter((n) => symbols[n] === '*').length,
        visibility: s === '.' || s === '*' ? 'hidden' : 'revealed',
      })),
    },
  }
}

/** A departure starts at the first authored scene; retries do not regenerate terrain. */
export function createStoryRun(floor = 0, health = 3, rescuedSupplies = false): StoryRun {
  const scene = PROLOGUE_SCENES[floor]
  if (!scene) throw new RangeError('Missing prologue scene')
  const board = buildStoryBoard(scene)
  return {
    floor,
    board,
    player: board.entrance,
    health,
    rescuedSupplies,
    inspected: false,
    practicedFlag: false,
    practicedReveal: false,
    collected: false,
    triggered: [],
    phase: 'exploring',
  }
}

/** Search only public, revealed ground; covered destinations may be approached but never crossed. */
export function storyPath(board: StoryBoard, player: number, target: number): number[] | null {
  const destination = board.game.cells[target]
  if (
    !Number.isInteger(target) ||
    !destination ||
    board.walls.includes(target) ||
    destination.visibility === 'flagged'
  )
    return null
  const parents = new Map<number, number>([[player, player]])
  const queue = [player]
  const covered = destination.visibility === 'hidden'
  let end: number | null = null
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const index = queue[cursor]!
    if (
      (!covered && index === target) ||
      (covered && adjacentSteps(board.game, index).includes(target))
    ) {
      end = index
      break
    }
    for (const next of adjacentSteps(board.game, index)) {
      const cell = board.game.cells[next]!
      if (
        !parents.has(next) &&
        !board.walls.includes(next) &&
        cell.visibility === 'revealed' &&
        !cell.mine
      ) {
        parents.set(next, index)
        queue.push(next)
      }
    }
  }
  if (end === null) return null
  const path = [end]
  while (path[0] !== player) path.unshift(parents.get(path[0]!)!)
  return path
}

/** Learning is proven by interactions with real clues and cells, not a Next button. */
export function storyLessonComplete(run: StoryRun): boolean {
  if (run.floor === 0) return run.inspected && run.practicedFlag && run.practicedReveal
  return run.floor !== 1 || run.practicedReveal
}

/** Give the first scene a precise teaching target; later scenes allow independent exploration. */
export function storyTeachingTarget(run: StoryRun): number | null {
  if (run.floor !== 0) return null
  if (!run.inspected) return run.board.scene.clue
  if (!run.practicedFlag) return run.board.scene.teachingMine
  if (!run.practicedReveal) return run.board.scene.teachingSafe
  return run.board.exit
}

/** Reveal connected zero ground and its numbered boundary without leaking through walls. */
function revealStoryGround(board: StoryBoard, target: number): StoryBoard {
  const cells = [...board.game.cells]
  const queue = [target]
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const index = queue[cursor]!
    const cell = cells[index]!
    if (board.walls.includes(index) || cell.visibility !== 'hidden' || cell.mine) continue
    cells[index] = { ...cell, visibility: 'revealed' }
    if (cell.adjacent === 0) queue.push(...neighbors(board.game.config, index))
  }
  return { ...board, game: { ...board.game, cells } }
}

/** Apply physical exploration, recoverable damage, teaching and explicit scene transitions. */
export function actStory(run: StoryRun, action: StoryAction): StoryRun {
  if (action.type === 'return') {
    if (run.phase === 'arrived') return { ...run, phase: 'exploring' }
    if (run.phase !== 'exploring' || run.floor === 0 || run.player !== run.board.entrance)
      return run
    return travelStory(run, run.floor - 1, true)
  }
  if (action.type === 'retry')
    return run.phase === 'fallen'
      ? { ...createStoryRun(run.floor, 3, run.rescuedSupplies), visited: run.visited ?? [] }
      : run
  if (run.phase !== 'exploring') return run
  if (action.type === 'continue') {
    if (run.player !== run.board.exit || !storyLessonComplete(run)) return run
    return run.floor === PROLOGUE_SCENES.length - 1
      ? { ...run, phase: 'arrived' }
      : travelStory(run, run.floor + 1, false)
  }
  const cell = run.board.game.cells[action.index]
  if (!Number.isInteger(action.index) || !cell || run.board.walls.includes(action.index)) return run
  if (action.type === 'inspect') {
    if (run.inspected || cell.visibility !== 'revealed' || action.index !== run.board.scene.clue)
      return run
    return { ...run, inspected: true }
  }
  if (action.type === 'flag') {
    if (cell.visibility === 'revealed' || run.triggered.includes(action.index)) return run
    return {
      ...run,
      practicedFlag:
        run.practicedFlag ||
        (action.index === run.board.scene.teachingMine && cell.visibility === 'hidden'),
      board: {
        ...run.board,
        game: {
          ...run.board.game,
          cells: run.board.game.cells.map((c, index) =>
            index === action.index
              ? { ...c, visibility: c.visibility === 'flagged' ? 'hidden' : 'flagged' }
              : c,
          ),
        },
      },
    }
  }
  const path = storyPath(run.board, run.player, action.index)
  if (!path) return run
  if (cell.visibility === 'hidden' && cell.mine) {
    const health = Math.max(0, run.health - 1)
    return {
      ...run,
      health,
      player: path.at(-1)!,
      phase: health ? 'exploring' : 'fallen',
      practicedFlag: run.practicedFlag || action.index === run.board.scene.teachingMine,
      triggered: [...run.triggered, action.index],
      board: {
        ...run.board,
        game: {
          ...run.board.game,
          cells: run.board.game.cells.map((c, index) =>
            index === action.index ? { ...c, visibility: 'flagged' } : c,
          ),
        },
      },
    }
  }
  if (action.index === run.player && cell.visibility === 'revealed') return run
  const board =
    cell.visibility === 'hidden' ? revealStoryGround(run.board, action.index) : run.board
  const teachingSafe = board.scene.teachingSafe
  return {
    ...run,
    player: action.index,
    board,
    practicedReveal:
      run.practicedReveal ||
      (teachingSafe !== null && board.game.cells[teachingSafe]?.visibility === 'revealed'),
    collected: run.collected || action.index === run.board.treasure,
  }
}

/** Return through the same doorway while retaining each scene's clues, marks and pickups. */
function travelStory(run: StoryRun, floor: number, backwards: boolean): StoryRun {
  const { visited = [], ...snapshot } = run
  const next = visited.find((scene) => scene.floor === floor) ?? createStoryRun(floor, run.health)
  return {
    ...next,
    health: run.health,
    rescuedSupplies: run.rescuedSupplies || run.collected,
    phase: 'exploring',
    player: backwards ? next.board.exit : next.board.entrance,
    visited: [...visited.filter((scene) => scene.floor !== run.floor), snapshot],
  }
}

/** Old camp saves discarded their journals; reopen the completed prologue as surveyed terrain. */
export function legacyStoryRoute(collected: boolean): StoryRun {
  const scenes = PROLOGUE_SCENES.map((_scene, floor) => {
    const run = createStoryRun(floor, 3, collected)
    return {
      ...run,
      inspected: true,
      practicedFlag: true,
      practicedReveal: true,
      collected: floor === 1 && collected,
      board: {
        ...run.board,
        game: {
          ...run.board.game,
          cells: run.board.game.cells.map((cell) => ({
            ...cell,
            visibility: cell.mine ? ('flagged' as const) : ('revealed' as const),
          })),
        },
      },
    }
  })
  const last = scenes[scenes.length - 1]!
  return { ...last, player: last.board.exit, phase: 'arrived', visited: scenes.slice(0, -1) }
}
