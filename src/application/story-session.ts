import { recordStoryFacts, storyTaskIntroduced } from '../game/story-quests.js'
import { CampSession } from './camp-session.js'
import { CAMP_SCENE, STORY_REVISION } from '../game/story-content.js'
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
  private actions: readonly StoryAction[] = []

  /** Restore current content only; retire old attempts to camp with one compensation. */
  constructor(camp: CampSession) {
    this.camp = camp
    const story = camp.story
    if (story.journal && story.journal.revision !== STORY_REVISION) {
      camp.saveStory({ ...story, arrived: true, journal: null }, 200)
      return
    }
    if (story.arrived && !story.journal) return
    let run = story.routeLegacy
      ? legacyStoryRoute(story.completed.includes('lost-satchel'))
      : createStoryRun()
    for (const action of story.journal?.actions ?? []) {
      const next = actStory(run, action)
      if (next === run) {
        // Retain the last valid checkpoint rather than silently jumping to the opening.
        break
      }
      run = next
      this.actions = [...this.actions, action]
    }
    this.current = run
    this.persist()
  }

  /** Null identifies the persistent camp scene. */
  get run(): StoryRun | null {
    return this.current
  }

  /** A full journal exposes a restart instead of trapping the player in an inert scene. */
  get exhausted(): boolean {
    return this.current !== null && this.actions.length >= 3000
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
    const legacy = progress.routeLegacy || !progress.route
    let run = legacy
      ? legacyStoryRoute(progress.completed.includes('lost-satchel'))
      : createStoryRun()
    const actions = progress.route?.actions ?? []
    if (actions.length >= 3000) return false
    for (const action of actions) {
      const next = actStory(run, action)
      if (next === run) return false
      run = next
    }
    if (run.phase !== 'arrived') return false
    this.current = actStory(run, { type: 'return' })
    this.actions = [...actions, { type: 'return' }]
    if (legacy) this.camp.saveStory({ ...progress, routeLegacy: true })
    this.persist()
    return true
  }

  /** Save each accepted interaction before its presentation animation begins. */
  dispatch(action: StoryAction): boolean {
    if (this.exhausted && action.type === 'retry') {
      this.current = createStoryRun()
      this.actions = []
      this.persist(true)
      return true
    }
    if (!this.current || this.exhausted) return false
    const next = actStory(this.current, action)
    if (next === this.current) return false
    this.current = next
    this.actions = [...this.actions, action]
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
    const progress = this.camp.story
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
    const player = board.walls.includes(progress.campPosition)
      ? board.entrance
      : progress.campPosition
    if (!progress.arrived) return null
    const targets = index === 51 ? adjacentSteps(board.game, index) : [index]
    const paths = targets.flatMap((target) => {
      const path = storyPath(board, player, target)
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
  private persist(resetRoute = false): void {
    const run = this.current
    if (!run) return
    const old = { ...this.camp.story }
    if (resetRoute) {
      delete old.route
      delete old.routeLegacy
    }
    const arrived = run.phase === 'arrived'
    const progress: StoryProgress = {
      ...old,
      arrived,
      journal: arrived ? null : { revision: STORY_REVISION, actions: this.actions },
      ...(arrived ? { route: { revision: STORY_REVISION, actions: this.actions } } : {}),
    }
    this.camp.saveStory(
      recordStoryFacts(progress, [
        ...(run.collected || run.rescuedSupplies ? ['satchel-secured' as const] : []),
        ...(arrived ? ['camp-reached' as const] : []),
        ...(arrived && run.rescuedSupplies ? ['satchel-delivered' as const] : []),
      ]),
    )
    if (arrived) this.current = null
  }
}
