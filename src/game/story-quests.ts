import type { MilestoneProgress } from '../types/milestones.js'
import type {
  StoryCondition,
  StoryCampaignMetric,
  StoryFact,
  StoryProgress,
  StoryTask,
  StoryTaskDefinition,
} from '../types/story.js'

export const STORY_CAMPAIGN_METRICS: readonly StoryCampaignMetric[] = [
  'travel',
  'chests',
  'floors',
  'bosses',
  'skills',
  'wins',
]

/** Apply only new accepted campaign activity, separately from world travel and roguelite. */
export function recordStoryCampaign(
  progress: StoryProgress,
  before: MilestoneProgress,
  after: MilestoneProgress,
): StoryProgress {
  const campaignActivity: Partial<Record<StoryCampaignMetric, number>> = {
    ...progress.campaignActivity,
  }
  for (const metric of STORY_CAMPAIGN_METRICS) {
    const delta = Math.max(0, after[metric] - before[metric])
    if (delta > 0) campaignActivity[metric] = Math.min(1e9, (campaignActivity[metric] ?? 0) + delta)
  }

  return recordStoryFacts({ ...progress, campaignActivity }, [])
}

export const STORY_FACTS: readonly StoryFact[] = [
  'reed-camp-reached',
  'reed-camp-settled',
  'recollection-awakened',
  'toma-rescued',
  'ridge-route',
  'ridge-surveyed',
  'beacon-recovered',
  'west-line-restored',
  'west-shortcut',
  'chapter-one-cleared',
  'camp-reached',
  'satchel-secured',
  'satchel-delivered',
  'guide-met',
  'lift-discovered',
  'road-reported',
  'spindle-secured',
  'lift-restored',
  'tower-reached',
]

export const STORY_TASKS: readonly StoryTaskDefinition[] = [
  {
    id: 'settle-reed-camp',
    category: 'main',
    introducedBy: 'west-departure',
    prerequisite: { kind: 'fact', id: 'chapter-one-cleared' },
    objective: {
      kind: 'all',
      conditions: [
        { kind: 'fact', id: 'reed-camp-settled' },
        { kind: 'fact', id: 'recollection-awakened' },
      ],
    },
    supplies: 0,
  },
  {
    id: 'rescue-toma',
    category: 'side',
    introducedBy: 'quarry-branch',
    prerequisite: { kind: 'fact', id: 'lift-discovered' },
    objective: { kind: 'fact', id: 'toma-rescued' },
    supplies: 0,
  },
  {
    id: 'restore-west-line',
    category: 'main',
    introducedBy: 'beacon-bearing',
    prerequisite: { kind: 'fact', id: 'beacon-recovered' },
    objective: { kind: 'fact', id: 'west-line-restored' },
    supplies: 0,
  },
  {
    id: 'open-blockade',
    category: 'main',
    introducedBy: 'west-line',
    prerequisite: { kind: 'fact', id: 'west-line-restored' },
    objective: { kind: 'fact', id: 'chapter-one-cleared' },
    supplies: 0,
  },
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
  {
    id: 'survey-road',
    category: 'main',
    introducedBy: 'north-road-start',
    prerequisite: { kind: 'task', id: 'meet-guide' },
    objective: { kind: 'fact', id: 'lift-discovered' },
    supplies: 20,
  },
  {
    id: 'repair-lift',
    category: 'main',
    introducedBy: 'quarry-lead',
    prerequisite: { kind: 'task', id: 'survey-road' },
    objective: { kind: 'fact', id: 'lift-restored' },
    supplies: 0,
  },
  {
    id: 'reach-tower',
    category: 'main',
    introducedBy: 'lift-repaired',
    prerequisite: { kind: 'task', id: 'repair-lift' },
    objective: { kind: 'fact', id: 'tower-reached' },
    supplies: 0,
  },
  {
    id: 'find-beacon',
    category: 'main',
    introducedBy: 'ridge-bearing',
    prerequisite: { kind: 'fact', id: 'ridge-surveyed' },
    objective: { kind: 'fact', id: 'beacon-recovered' },
    supplies: 0,
  },
  {
    id: 'survey-ridge',
    category: 'main',
    introducedBy: 'nia-route',
    prerequisite: { kind: 'fact', id: 'ridge-route' },
    objective: { kind: 'fact', id: 'ridge-surveyed' },
    supplies: 0,
  },
]

/** Completed objectives unlock routes even before a separate reward has been claimed. */
export function storyConditionMet(condition: StoryCondition, progress: StoryProgress): boolean {
  switch (condition.kind) {
    case 'campaign':
      return (progress.campaignActivity?.[condition.metric] ?? 0) >= condition.target
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
  id: StoryTaskDefinition['introducedBy'],
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

/** One catalog category drives labels and priority in every quest presentation. */
export function storyTaskCategory(id: StoryTask): StoryTaskDefinition['category'] {
  const task = STORY_TASKS.find((entry) => entry.id === id)
  if (!task) throw new Error('Unknown story task')
  return task.category
}

/** Active main quests precede side quests; stable sorting retains acceptance order within groups. */
export function orderedStoryTasks(
  progress: Pick<StoryProgress, 'accepted' | 'completed'>,
): StoryTask[] {
  /** Finished tasks share one trailing group regardless of their former priority. */
  const rank = (id: StoryTask): number =>
    progress.completed.includes(id) ? 2 : storyTaskCategory(id) === 'main' ? 0 : 1
  return [...(progress.accepted ?? [])].sort((left, right) => rank(left) - rank(right))
}
