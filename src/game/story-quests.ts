import type {
  StoryCondition,
  StoryDialogueId,
  StoryFact,
  StoryProgress,
  StoryTask,
  StoryTaskDefinition,
} from '../types/story.js'

export const STORY_FACTS: readonly StoryFact[] = [
  'camp-reached',
  'satchel-secured',
  'satchel-delivered',
  'guide-met',
]

export const STORY_TASKS: readonly StoryTaskDefinition[] = [
  {
    id: 'reach-camp',
    category: 'main',
    introducedBy: 'wake',
    prerequisite: { kind: 'all', conditions: [] },
    objective: { kind: 'fact', id: 'camp-reached' },
    supplies: 60,
  },
  {
    id: 'lost-satchel',
    category: 'side',
    introducedBy: 'trail',
    prerequisite: { kind: 'all', conditions: [] },
    objective: {
      kind: 'all',
      conditions: [
        { kind: 'fact', id: 'satchel-secured' },
        { kind: 'fact', id: 'satchel-delivered' },
      ],
    },
    supplies: 30,
  },
  {
    id: 'meet-guide',
    category: 'main',
    introducedBy: 'arrival',
    prerequisite: { kind: 'task', id: 'reach-camp' },
    objective: { kind: 'fact', id: 'guide-met' },
    supplies: 0,
  },
]

/** Completed objectives unlock routes even before a separate reward has been claimed. */
export function storyConditionMet(condition: StoryCondition, progress: StoryProgress): boolean {
  switch (condition.kind) {
    case 'fact':
      return progress.facts?.includes(condition.id) ?? false
    case 'task':
      return progress.completed.includes(condition.id)
    case 'dialogue':
      return progress.dialogue?.completed.includes(condition.id) ?? false
    case 'all':
      return condition.conditions.every((child) => storyConditionMet(child, progress))
    case 'any':
      return condition.conditions.some((child) => storyConditionMet(child, progress))
  }
}

/** Accept at the authored conversation boundary; replay never accepts a duplicate. */
export function storyTaskIntroduced(
  id: StoryDialogueId,
  progress: StoryProgress,
): StoryTask | null {
  return (
    STORY_TASKS.find(
      (task) =>
        task.introducedBy === id &&
        !progress.accepted?.includes(task.id) &&
        !progress.completed.includes(task.id) &&
        storyConditionMet(task.prerequisite, progress),
    )?.id ?? null
  )
}

/** Only accepted physical outcomes enter the durable fact ledger; rendering never calls this. */
export function recordStoryFacts(
  progress: StoryProgress,
  facts: readonly StoryFact[],
): StoryProgress {
  const next = { ...progress, facts: [...new Set([...(progress.facts ?? []), ...facts])] }
  const completed = [...next.completed]
  for (const task of STORY_TASKS) {
    if (
      !completed.includes(task.id) &&
      storyConditionMet(task.prerequisite, { ...next, completed }) &&
      storyConditionMet(task.objective, { ...next, completed })
    )
      completed.push(task.id)
  }
  return { ...next, completed, pinned: (next.pinned ?? []).filter((id) => !completed.includes(id)) }
}

/** Rewards come from authored content, never serialized amounts or dialogue text. */
export function storyTaskReward(id: StoryTask): number {
  return STORY_TASKS.find((task) => task.id === id)!.supplies
}

/** Resolve authored task references for dependency validation, including nested groups. */
function conditionTasks(condition: StoryCondition): readonly StoryTask[] {
  if (condition.kind === 'task') return [condition.id]
  return condition.kind === 'all' || condition.kind === 'any'
    ? condition.conditions.flatMap(conditionTasks)
    : []
}

/** Reject ambiguous IDs, missing references and circular quest gates before content ships. */
export function validateStoryTasks(tasks: readonly StoryTaskDefinition[]): readonly string[] {
  const errors: string[] = []
  const ids = new Set<StoryTask>()
  for (const task of tasks) {
    if (ids.has(task.id)) errors.push(`Duplicate task: ${task.id}`)
    ids.add(task.id)
    if (!Number.isSafeInteger(task.supplies) || task.supplies < 0)
      errors.push(`Invalid reward: ${task.id}`)
  }
  /** Traverse every reference, including outcomes that could conceal a circular dependency. */
  function visit(id: StoryTask, path: readonly StoryTask[]): void {
    if (path.includes(id)) {
      errors.push(`Circular task: ${[...path, id].join(' -> ')}`)
      return
    }
    const task = tasks.find((entry) => entry.id === id)
    if (!task) {
      errors.push(`Missing task: ${id}`)
      return
    }
    for (const dependency of [
      ...conditionTasks(task.prerequisite),
      ...conditionTasks(task.objective),
    ])
      visit(dependency, [...path, id])
  }
  for (const task of tasks) visit(task.id, [])
  return [...new Set(errors)]
}
