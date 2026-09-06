import { roomTravel } from './mirror-state.js'
import { approachPath } from './dungeon-path.js'
import type { Camp, Expedition } from '../types/variants.js'
import type {
  MilestoneDefinition,
  MilestoneId,
  MilestoneProgress,
  MilestoneRelic,
} from '../types/milestones.js'

export const MILESTONES: readonly MilestoneDefinition[] = [
  {
    id: 'first-steps',
    kind: 'missions',
    metric: 'travel',
    target: 20,
    supplies: 120,
    reward: null,
  },
  {
    id: 'treasure-scout',
    kind: 'missions',
    metric: 'chests',
    target: 3,
    supplies: 250,
    reward: { kind: 'upgrade', id: 'surveyor' },
  },
  {
    id: 'field-practice',
    kind: 'missions',
    metric: 'skills',
    target: 3,
    supplies: 350,
    reward: { kind: 'upgrade', id: 'workshop' },
  },
  {
    id: 'floor-runner',
    kind: 'missions',
    metric: 'floors',
    target: 5,
    supplies: 600,
    reward: { kind: 'equipment', id: 'field-radio' },
  },
  {
    id: 'first-boss',
    kind: 'missions',
    metric: 'bosses',
    target: 1,
    supplies: 800,
    reward: { kind: 'upgrade', id: 'engineer' },
  },
  {
    id: 'veteran',
    kind: 'achievements',
    metric: 'wins',
    target: 3,
    supplies: 1200,
    reward: { kind: 'relic', id: 'trail-heart' },
  },
  {
    id: 'relic-curator',
    kind: 'achievements',
    metric: 'relics',
    target: 8,
    supplies: 1500,
    reward: { kind: 'relic', id: 'survey-token' },
  },
  {
    id: 'boss-slayer',
    kind: 'achievements',
    metric: 'bosses',
    target: 10,
    supplies: 2500,
    reward: { kind: 'upgrade', id: 'battle-manual' },
  },
  {
    id: 'four-legends',
    kind: 'achievements',
    metric: 'bossKinds',
    target: 4,
    supplies: 3000,
    reward: { kind: 'upgrade', id: 'sentinel' },
  },
  {
    id: 'abyss-clear',
    kind: 'achievements',
    metric: 'abyssWins',
    target: 1,
    supplies: 5000,
    reward: { kind: 'upgrade', id: 'archaeologist' },
  },
]

/** Old camps can prove victory totals only; do not invent unrecorded history. */
export function milestoneProgress(camp: Camp): MilestoneProgress {
  return (
    camp.milestones ?? {
      travel: 0,
      chests: 0,
      floors: 0,
      bosses: 0,
      skills: 0,
      wins: camp.completed,
      abyssWins: 0,
      relics: [],
      bossKinds: [],
      claimed: [],
    }
  )
}

export function parseMilestone(value: string | undefined): MilestoneId | null {
  return MILESTONES.find((entry) => entry.id === value)?.id ?? null
}

export function milestoneValue(camp: Camp, entry: MilestoneDefinition): number {
  const progress = milestoneProgress(camp)
  if (entry.metric === 'wins') return Math.max(camp.completed, progress.wins)
  const value = progress[entry.metric]
  return typeof value === 'number' ? value : value.length
}

/** Never run during replay; accepted actions and their cumulative counters commit together. */
export function advanceMilestones(camp: Camp, before: Expedition, after: Expedition): Camp {
  if (before === after) return camp
  const progress = milestoneProgress(camp)
  const sameFloor = before.floor === after.floor
  const completedFloor =
    (after.phase === 'reward' || after.phase === 'won') &&
    before.phase !== 'reward' &&
    before.phase !== 'won'
  const boss =
    before.phase === 'boss' &&
    before.encounter &&
    before.encounter.health > 0 &&
    after.encounter?.health === 0 &&
    completedFloor
      ? before.encounter.kind
      : null
  const won = after.phase === 'won' && before.phase !== 'won'
  // Entering a boss replaces room-local chests, but the accepted walk to its stairs can collect one.
  const enteringBoss = sameFloor && !before.encounter && after.encounter !== null
  const stairsPath = enteringBoss ? approachPath(before, before.exit) : null
  const chests = enteringBoss
    ? before.treasures.filter(
        (index) => !before.collected.includes(index) && stairsPath?.includes(index),
      ).length
    : sameFloor
      ? after.collected.filter((index) => !before.collected.includes(index)).length
      : 0
  const add = (value: number, increment: number): number =>
    Math.min(1e9, value + Math.max(0, increment))
  return {
    ...camp,
    milestones: {
      ...progress,
      travel: add(
        progress.travel,
        sameFloor
          ? after.priorTravel + roomTravel(after) - before.priorTravel - roomTravel(before)
          : 0,
      ),
      chests: add(progress.chests, chests),
      floors: add(progress.floors, Number(completedFloor)),
      bosses: add(progress.bosses, Number(boss !== null)),
      skills: add(progress.skills, Number(sameFloor && !before.skillUsed && after.skillUsed)),
      wins: add(Math.max(progress.wins, camp.completed), Number(won)),
      abyssWins: add(progress.abyssWins, Number(won && after.departure.difficulty === 'abyss')),
      relics: [...new Set([...progress.relics, ...after.relics])],
      bossKinds: boss ? [...new Set([...progress.bossKinds, boss])] : progress.bossKinds,
    },
  }
}

/** A claim atomically records ownership and finite currency; repeated claims are no-ops. */
export function claimMilestone(camp: Camp, id: MilestoneId): Camp {
  const entry = MILESTONES.find((item) => item.id === id)
  const progress = milestoneProgress(camp)
  if (!entry || progress.claimed.includes(id) || milestoneValue(camp, entry) < entry.target)
    return camp
  const upgrade = entry.reward?.kind === 'upgrade' ? entry.reward.id : null
  return {
    ...camp,
    supplies: Math.min(Number.MAX_SAFE_INTEGER, camp.supplies + entry.supplies),
    upgrades:
      upgrade && !camp.upgrades.includes(upgrade) ? [...camp.upgrades, upgrade] : camp.upgrades,
    milestones: { ...progress, claimed: [...progress.claimed, id] },
  }
}

export function hasFieldRadio(camp: Camp): boolean {
  return milestoneProgress(camp).claimed.includes('floor-runner')
}

/** Reward relics enrich future offer pools in stable catalog order, never the active run. */
export function ownedMilestoneRelics(camp: Camp): MilestoneRelic[] {
  return MILESTONES.flatMap((entry) =>
    entry.reward?.kind === 'relic' && milestoneProgress(camp).claimed.includes(entry.id)
      ? [entry.reward.id]
      : [],
  )
}
