import { CampSession } from './camp-session.js'
import { CAMP_SCENE, STORY_REVISION } from '../game/story-content.js'
import { actStory, buildStoryBoard, createStoryRun, storyPath } from '../game/story.js'
import { adjacentSteps } from '../game/variant-board.js'
import type { StoryAction, StoryProgress, StoryRun } from '../types/story.js'

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
    if (story.arrived) return
    let run = createStoryRun()
    for (const action of story.journal?.actions ?? []) {
      const next = actStory(run, action)
      if (next === run) {
        run = createStoryRun()
        this.actions = []
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

  /** Save each accepted interaction before its presentation animation begins. */
  dispatch(action: StoryAction): boolean {
    if (this.exhausted && action.type === 'retry') {
      this.current = createStoryRun()
      this.actions = []
      this.persist()
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
    this.camp.saveStory({
      ...progress,
      completed: [...new Set([...progress.completed, 'meet-guide' as const])],
    })
  }

  /** Arrival, journal removal and one-time rewards share a single storage write. */
  private persist(): void {
    const run = this.current
    if (!run) return
    const old = this.camp.story
    const arrived = run.phase === 'arrived'
    const progress: StoryProgress = {
      ...old,
      arrived,
      completed: arrived
        ? [
            ...old.completed,
            'reach-camp',
            ...(run.rescuedSupplies ? ['lost-satchel' as const] : []),
          ]
        : old.completed,
      journal: arrived ? null : { revision: STORY_REVISION, actions: this.actions },
    }
    this.camp.saveStory(progress)
    if (arrived) this.current = null
  }
}
