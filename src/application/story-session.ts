import { NIA_CAMP_CELL } from '../game/signal-story.js'
import { checkpointStory, restoreStoryWorld, storyWorldScenes } from '../game/story-checkpoint.js'
import { recordStoryFacts, storyTaskIntroduced } from '../game/story-quests.js'
import { CampSession } from './camp-session.js'
import { CAMP_SCENE, QUARRY_GATE, STORY_REVISION } from '../game/story-content.js'
import {
  actStory,
  buildStoryBoard,
  createStoryRun,
  legacyStoryRoute,
  storyPath,
} from '../game/story.js'
import { adjacentSteps } from '../game/variant-board.js'
import type {
  StoryAction,
  StoryDialogueId,
  StoryProgress,
  StoryRun,
  StoryTask,
} from '../types/story.js'

/** Own authored progression independently of a paused roguelite attempt. */
export class StorySession {
  readonly camp: CampSession
  private current: StoryRun | null = null

  /** Restore current content only; retire old attempts to camp with one compensation. */
  constructor(camp: CampSession) {
    this.camp = camp
    const story = camp.story
    if (story.world) {
      if (story.world.revision !== STORY_REVISION) {
        const active = story.world.active !== null
        camp.saveStory(
          {
            ...story,
            arrived: true,
            journal: null,
            world: { revision: STORY_REVISION, active: null, hasVisited: false, scenes: [] },
          },
          active ? 200 : 0,
        )
        return
      }
      this.current = restoreStoryWorld(story.world)
      return
    }
    if (story.journal && story.journal.revision !== STORY_REVISION) {
      camp.saveStory(
        {
          ...story,
          arrived: true,
          journal: null,
          world: { revision: STORY_REVISION, active: null, hasVisited: false, scenes: [] },
        },
        200,
      )
      return
    }
    const atCamp = story.arrived && !story.journal
    const history = atCamp ? story.route : story.journal
    let run =
      story.routeLegacy || (atCamp && !history)
        ? legacyStoryRoute(story.completed.includes('lost-satchel'))
        : createStoryRun()
    for (const action of history?.actions ?? []) {
      const next = actStory(run, action)
      if (next === run) break
      run = next
    }
    if (atCamp) {
      const checkpoint = checkpointStory(run)
      const progress = { ...story, journal: null, world: { ...checkpoint, active: null } }
      delete progress.route
      delete progress.routeLegacy
      camp.saveStory(progress)
    } else {
      this.current = run
      this.persist()
    }
  }

  /** Null identifies the persistent camp scene. */
  get run(): StoryRun | null {
    return this.current
  }

  /** The southern camp gate reopens the preserved route, without awarding arrival again. */
  leaveCamp(): boolean {
    const progress = this.camp.story
    if (
      this.current ||
      !progress.arrived ||
      progress.campPosition !== buildStoryBoard(CAMP_SCENE).exit
    )
      return false
    const world = progress.world
    const saved =
      world &&
      (world.scenes.length === 0
        ? legacyStoryRoute(progress.completed.includes('lost-satchel'))
        : restoreStoryWorld(world, 'approach'))
    if (!saved) return false
    this.current = { ...saved, health: 3, player: saved.board.exit, phase: 'exploring' }
    this.persist()
    return true
  }

  /** Enter the northern world road after the guide has supplied its map. */
  enterNorthRoad(): boolean {
    const progress = this.camp.story
    if (
      this.current ||
      progress.campPosition !== 13 ||
      !progress.mapOwned ||
      !progress.completed.includes('meet-guide') ||
      !progress.world
    )
      return false
    const saved = restoreStoryWorld(progress.world, 'north-road')
    const initial = saved ?? { ...createStoryRun(3), visited: storyWorldScenes(progress.world) }
    this.current = {
      ...initial,
      player: initial.board.entrance,
      health: 3,
      phase: 'exploring',
    }
    this.persist()
    return true
  }

  /** Save each accepted interaction before its presentation animation begins. */
  dispatch(action: StoryAction): boolean {
    if (!this.current) return false
    const next = actStory(this.current, action)
    if (next === this.current) return false
    this.current = next
    this.persist()
    return true
  }

  /** Physical world doorways share their prerequisite checks with durable repair outcomes. */
  travelWorld(): boolean {
    const run = this.current
    if (!run || run.phase !== 'exploring' || run.floor < 3) return false
    const progress = this.camp.story
    let floor: number | null = null
    let target: number | null = null
    if (run.floor === 3) {
      if (run.player === run.board.entrance) return this.dispatch({ type: 'return' })
      if (run.player === QUARRY_GATE && progress.accepted?.includes('repair-lift')) floor = 4
      if (run.player === run.board.exit && progress.facts?.includes('spindle-secured')) {
        if (!progress.facts.includes('lift-restored')) {
          this.camp.saveStory(recordStoryFacts(progress, ['lift-restored']))
          return true
        }
        if (progress.dialogue?.completed.includes('lift-repaired')) floor = 7
      }
    } else if (run.player === run.board.entrance) {
      floor = run.floor === 7 ? 3 : run.floor - 1
      target = run.floor === 4 ? QUARRY_GATE : createStoryRun(floor).board.exit
    } else if (run.player === run.board.exit && run.floor < 6) floor = run.floor + 1
    else if (run.floor === 6 && run.player === run.board.exit) {
      floor = 5
      target = createStoryRun(5).board.exit
    }
    if (floor === null) return false
    const { visited = [], ...snapshot } = run
    const saved = visited.find((scene) => scene.floor === floor) ?? createStoryRun(floor)
    this.current = {
      ...saved,
      player: target ?? saved.board.entrance,
      health: run.health,
      phase: 'exploring',
      visited: [
        ...visited.filter((scene) => scene.floor !== floor && scene.floor !== run.floor),
        snapshot,
      ],
    }
    this.persist()
    return true
  }

  /** Accept only the objective introduced by the current scene's completed dialogue. */
  acceptTask(): StoryTask | null {
    const progress = this.camp.story
    const event = !this.current
      ? 'arrival'
      : this.current.floor === 0
        ? 'wake'
        : this.current.floor === 1
          ? 'trail'
          : null
    const id = event ? storyTaskIntroduced(event, progress) : null
    if (!id || progress.accepted?.includes(id) || progress.completed.includes(id)) return null
    this.camp.saveStory({
      ...progress,
      accepted: [...(progress.accepted ?? []), id],
      pinned: [...(progress.pinned ?? []), id],
    })
    return id
  }

  /** Tracking affects only the sidebar, never objective progression or rewards. */
  togglePin(id: StoryTask): void {
    const progress = this.camp.story
    if (!progress.accepted?.includes(id) || progress.completed.includes(id)) return
    const pinned = progress.pinned ?? []
    this.camp.saveStory({
      ...progress,
      pinned: pinned.includes(id) ? pinned.filter((task) => task !== id) : [...pinned, id],
    })
  }

  /** Persist the current sentence without coupling progression to localized text. */
  checkpointDialogue(id: StoryDialogueId, beat: number): void {
    const progress = this.camp.story
    if (progress.dialogue?.completed.includes(id)) return
    this.camp.saveStory({
      ...progress,
      dialogue: { completed: progress.dialogue?.completed ?? [], active: { id, beat } },
    })
  }

  /** Quest acceptance, map handover and event completion share one atomic save. */
  completeDialogue(id: StoryDialogueId): StoryTask | null {
    if (
      id === 'north-road-report' &&
      (this.current ||
        !this.camp.story.facts?.includes('lift-discovered') ||
        !adjacentSteps(buildStoryBoard(CAMP_SCENE).game, this.camp.story.campPosition).includes(51))
    )
      return null
    const progress =
      id === 'north-road-report'
        ? recordStoryFacts(this.camp.story, ['road-reported'])
        : this.camp.story
    if (progress.dialogue?.completed.includes(id)) return null
    const accept = storyTaskIntroduced(id, progress)
    this.camp.saveStory({
      ...progress,
      accepted: accept ? [...(progress.accepted ?? []), accept] : (progress.accepted ?? []),
      pinned: accept ? [...(progress.pinned ?? []), accept] : (progress.pinned ?? []),
      mapOwned: progress.mapOwned || (id === 'guide' && progress.completed.includes('meet-guide')),
      dialogue: { completed: [...(progress.dialogue?.completed ?? []), id], active: null },
    })
    return accept
  }

  /** The guide hands over the map after the player finishes the camp conversation. */
  receiveMap(): void {
    const progress = this.camp.story
    if (progress.completed.includes('meet-guide'))
      this.camp.saveStory({ ...progress, mapOwned: true })
  }

  /** Approach the guide from a neighboring tile so both characters remain visible. */
  campPath(index: number): readonly number[] | null {
    const progress = this.camp.story
    const board = buildStoryBoard(CAMP_SCENE)
    const residents = this.camp.signalRescue.cleared ? [51, NIA_CAMP_CELL] : [51]
    const player =
      board.walls.includes(progress.campPosition) || residents.includes(progress.campPosition)
        ? board.entrance
        : progress.campPosition
    if (!progress.arrived) return null
    const resident = index === NIA_CAMP_CELL && this.camp.signalRescue.cleared
    const targets = index === 51 || resident ? adjacentSteps(board.game, index) : [index]
    const paths = targets.flatMap((target) => {
      const path = storyPath({ ...board, walls: [...board.walls, ...residents] }, player, target)
      return path ? [path] : []
    })
    return paths.sort((a, b) => a.length - b.length)[0] ?? null
  }

  /** Persist movement through already established safe camp paths. */
  moveCamp(index: number): boolean {
    const path = this.campPath(index)
    if (!path) return false
    this.camp.saveStory({ ...this.camp.story, campPosition: path.at(-1)! })
    return true
  }

  /** A conversation after physical arrival completes the camp's first main objective. */
  meetGuide(): void {
    const progress = this.camp.story
    const board = buildStoryBoard(CAMP_SCENE)
    if (!progress.arrived || !adjacentSteps(board.game, progress.campPosition).includes(51)) return
    this.camp.saveStory(recordStoryFacts(progress, ['guide-met']))
  }

  /** Arrival, journal removal and one-time rewards share a single storage write. */
  private persist(): void {
    const run = this.current
    if (!run) return
    const old = { ...this.camp.story }
    delete old.route
    delete old.routeLegacy
    const arrived = run.phase === 'arrived'
    const progress: StoryProgress = {
      ...old,
      arrived,
      journal: null,
      world: checkpointStory(arrived ? { ...run, health: 3 } : run),
      ...(arrived && run.board.scene.id === 'north-road' ? { campPosition: 13 } : {}),
    }
    this.camp.saveStory(
      recordStoryFacts(progress, [
        ...((run.floor === 1 && run.collected) || run.rescuedSupplies
          ? ['satchel-secured' as const]
          : []),
        ...(run.board.scene.id === 'quarry-machine' && run.collected
          ? ['spindle-secured' as const]
          : []),
        ...(run.board.scene.id === 'tower-landing' && run.player === run.board.exit
          ? ['tower-reached' as const]
          : []),
        ...(arrived ? ['camp-reached' as const] : []),
        ...(run.board.scene.id === 'north-road' && run.player === run.board.exit
          ? ['lift-discovered' as const]
          : []),
        ...(arrived && run.rescuedSupplies ? ['satchel-delivered' as const] : []),
      ]),
    )
    if (arrived) this.current = null
  }
}
