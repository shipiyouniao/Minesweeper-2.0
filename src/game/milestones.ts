import { roomTravel } from './mirror-state.js'
import { approachPath } from './dungeon-path.js'
import type { Camp, Expedition, Profession } from '../types/variants.js'
import type {
  MilestoneDefinition,
  MilestoneId,
  MilestoneProgress,
  MilestoneRelic,
} from '../types/milestones.js'

export const MILESTONES: readonly MilestoneDefinition[] = [
  {
    id: 'bastion-flawless',
    kind: 'achievements',
    metric: 'challenge',
    target: 1,
    supplies: 3000,
    reward: null,
  },
  {
    id: 'mirror-flawless',
    kind: 'achievements',
    metric: 'challenge',
    target: 1,
    supplies: 3000,
    reward: null,
  },
  {
    id: 'clock-no-glass',
    kind: 'achievements',
    metric: 'challenge',
    target: 1,
    supplies: 3000,
    reward: null,
  },
  {
    id: 'magnetic-demolition',
    kind: 'achievements',
    metric: 'challenge',
    target: 1,
    supplies: 3000,
    reward: null,
  },
  {
    id: 'brood-nest-spared',
    kind: 'achievements',
    metric: 'challenge',
    target: 1,
    supplies: 3000,
    reward: null,
  },

  {
    id: 'hunt-bastion',
    kind: 'missions',
    metric: 'bossKill',
    bossKind: 'bastion',
    target: 1,
    supplies: 1000,
    reward: null,
  },
  {
    id: 'hunt-brood',
    kind: 'missions',
    metric: 'bossKill',
    bossKind: 'brood',
    target: 1,
    supplies: 1000,
    reward: null,
  },
  {
    id: 'hunt-mirror',
    kind: 'missions',
    metric: 'bossKill',
    bossKind: 'mirror',
    target: 1,
    supplies: 1000,
    reward: null,
  },
  {
    id: 'hunt-magnetic',
    kind: 'missions',
    metric: 'bossKill',
    bossKind: 'magnetic',
    target: 1,
    supplies: 1000,
    reward: null,
  },
  {
    id: 'hunt-clock',
    kind: 'missions',
    metric: 'bossKill',
    bossKind: 'clock',
    target: 1,
    supplies: 1000,
    reward: null,
  },
  {
    id: 'web-untouched',
    kind: 'achievements',
    metric: 'challenge',
    target: 1,
    supplies: 2500,
    reward: null,
  },
  {
    id: 'field-unscathed',
    kind: 'achievements',
    metric: 'challenge',
    target: 1,
    supplies: 2500,
    reward: null,
  },

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
    reward: { kind: 'relic', id: 'chest-beacon' },
  },
  {
    id: 'field-practice',
    kind: 'missions',
    metric: 'skills',
    target: 3,
    supplies: 350,
    reward: { kind: 'relic', id: 'pulse-coil' },
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
    reward: { kind: 'relic', id: 'last-bastion' },
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
    reward: { kind: 'relic', id: 'hunter-seal' },
  },
  {
    id: 'four-legends',
    kind: 'achievements',
    metric: 'bossKinds',
    target: 4,
    supplies: 3000,
    reward: { kind: 'relic', id: 'fault-map' },
  },
  {
    id: 'abyss-clear',
    kind: 'achievements',
    metric: 'abyssWins',
    target: 1,
    supplies: 5000,
    reward: { kind: 'relic', id: 'abyss-hourglass' },
  },
  {
    id: 'trail-apprentice',
    kind: 'missions',
    metric: 'travel',
    target: 60,
    supplies: 250,
    reward: null,
  },
  {
    id: 'trail-guide',
    kind: 'missions',
    metric: 'travel',
    target: 150,
    supplies: 500,
    reward: null,
  },
  {
    id: 'cache-runner',
    kind: 'missions',
    metric: 'chests',
    target: 10,
    supplies: 650,
    reward: null,
  },
  {
    id: 'cache-seeker',
    kind: 'missions',
    metric: 'chests',
    target: 25,
    supplies: 1000,
    reward: null,
  },
  {
    id: 'skill-student',
    kind: 'missions',
    metric: 'skills',
    target: 10,
    supplies: 700,
    reward: null,
  },
  {
    id: 'skill-adept',
    kind: 'missions',
    metric: 'skills',
    target: 25,
    supplies: 1100,
    reward: null,
  },
  {
    id: 'deep-route',
    kind: 'missions',
    metric: 'floors',
    target: 12,
    supplies: 900,
    reward: { kind: 'profession', id: 'waymarker' },
  },
  {
    id: 'deep-descent',
    kind: 'missions',
    metric: 'floors',
    target: 25,
    supplies: 1400,
    reward: null,
  },
  {
    id: 'boss-challenger',
    kind: 'missions',
    metric: 'bosses',
    target: 3,
    supplies: 1200,
    reward: null,
  },
  {
    id: 'first-victory',
    kind: 'missions',
    metric: 'wins',
    target: 1,
    supplies: 1000,
    reward: null,
  },
  {
    id: 'long-road',
    kind: 'achievements',
    metric: 'travel',
    target: 500,
    supplies: 1600,
    reward: null,
  },
  {
    id: 'world-walker',
    kind: 'achievements',
    metric: 'travel',
    target: 1500,
    supplies: 3500,
    reward: null,
  },
  {
    id: 'treasure-vault',
    kind: 'achievements',
    metric: 'chests',
    target: 75,
    supplies: 2200,
    reward: null,
  },
  {
    id: 'treasure-legend',
    kind: 'achievements',
    metric: 'chests',
    target: 200,
    supplies: 4500,
    reward: null,
  },
  {
    id: 'skill-master',
    kind: 'achievements',
    metric: 'skills',
    target: 75,
    supplies: 2400,
    reward: null,
  },
  {
    id: 'skill-legend',
    kind: 'achievements',
    metric: 'skills',
    target: 200,
    supplies: 5000,
    reward: null,
  },
  {
    id: 'depth-pioneer',
    kind: 'achievements',
    metric: 'floors',
    target: 50,
    supplies: 3000,
    reward: { kind: 'profession', id: 'riftwalker' },
  },
  {
    id: 'depth-legend',
    kind: 'achievements',
    metric: 'floors',
    target: 150,
    supplies: 6000,
    reward: null,
  },
  {
    id: 'relic-museum',
    kind: 'achievements',
    metric: 'relics',
    target: 20,
    supplies: 4000,
    reward: null,
  },
  {
    id: 'abyss-veteran',
    kind: 'achievements',
    metric: 'abyssWins',
    target: 5,
    supplies: 8000,
    reward: null,
  },
]

/** Old camps can prove victory totals only; do not invent unrecorded history. */
export function milestoneProgress(camp: Camp): MilestoneProgress {
  return (
    camp.milestones ?? {
      title: null,
      attempt: undefined,
      challenges: [],
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
  if (entry.metric === 'bossKill')
    return Number(entry.bossKind !== undefined && progress.bossKinds.includes(entry.bossKind))
  if (entry.metric === 'challenge') return Number(progress.challenges?.includes(entry.id) === true)
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
  let attempt =
    enteringBoss && after.encounter
      ? {
          seed: after.departure.seed,
          floor: after.floor,
          kind: after.encounter.kind,
          failed: false,
          hurt: false,
          glass: false,
          blasted: false,
        }
      : progress.attempt
  const known =
    attempt &&
    attempt.seed === before.departure.seed &&
    attempt.floor === before.floor &&
    attempt.kind === before.encounter?.kind
  if (known && attempt) {
    const a = before.encounter
    const b = after.encounter
    const cut =
      a?.kind === 'brood' && b?.kind === 'brood' && a.webs.some((cell) => !b.webs.includes(cell))
    const hit =
      a?.kind === 'magnetic' &&
      b?.kind === 'magnetic' &&
      a.forecast.kind === 'field' &&
      b.turn > a.turn &&
      b.resolution?.impact != null &&
      before.game.cells[b.resolution.impact]?.mine === true
    attempt = {
      ...attempt,
      failed: attempt.failed || cut || hit,
      hurt:
        attempt.hurt ||
        after.health < before.health ||
        after.runTriggers.some(
          (id) =>
            (id === 'second-wind' || id === 'abyss-hourglass') && !before.runTriggers.includes(id),
        ),
      glass: attempt.glass || (b?.kind === 'clock' && b.hourglasses.some((item) => item.used)),
      blasted:
        attempt.blasted ||
        (b?.kind === 'magnetic' && (b.resolution?.detonatedMines.length ?? 0) > 0),
    }
  }
  const earned: MilestoneId[] = []
  if (boss && known && attempt) {
    if (boss === 'brood' && !attempt.failed) earned.push('web-untouched')
    if (boss === 'magnetic' && !attempt.failed) earned.push('field-unscathed')
    if (boss === 'bastion' && !attempt.hurt) earned.push('bastion-flawless')
    if (boss === 'mirror' && !attempt.hurt) earned.push('mirror-flawless')
    if (boss === 'clock' && !attempt.glass) earned.push('clock-no-glass')
    if (boss === 'magnetic' && attempt.blasted) earned.push('magnetic-demolition')
    if (after.encounter?.kind === 'brood' && after.encounter.nests.length > 0)
      earned.push('brood-nest-spared')
  }
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
      title: progress.title ?? null,
      attempt,
      challenges: [...new Set([...(progress.challenges ?? []), ...earned])],
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
  return {
    ...camp,
    supplies: Math.min(Number.MAX_SAFE_INTEGER, camp.supplies + entry.supplies),
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

/** Reward careers are licenses, never purchasable camp upgrades. */
export function ownsProfession(camp: Camp, profession: Profession): boolean {
  if (profession === 'waymarker' || profession === 'riftwalker')
    return MILESTONES.some(
      (entry) =>
        entry.reward?.kind === 'profession' &&
        entry.reward.id === profession &&
        milestoneProgress(camp).claimed.includes(entry.id),
    )
  return profession === 'explorer' || camp.upgrades.includes(profession)
}

export const MILESTONE_RELICS: readonly MilestoneRelic[] = [
  'trail-heart',
  'survey-token',
  'chest-beacon',
  'pulse-coil',
  'last-bastion',
  'hunter-seal',
  'fault-map',
  'abyss-hourglass',
]
export function parseMilestoneRelic(value: string | null): MilestoneRelic | null {
  return MILESTONE_RELICS.find((id) => id === value) ?? null
}

/** Titles derive from claims, including saves made before titles existed. */
export function ownedTitles(camp: Camp): MilestoneId[] {
  return MILESTONES.filter(
    (entry) => entry.kind === 'achievements' && milestoneProgress(camp).claimed.includes(entry.id),
  ).map((entry) => entry.id)
}
export function equipTitle(camp: Camp, id: MilestoneId | null): Camp {
  if (id !== null && !ownedTitles(camp).includes(id)) return camp
  if ((milestoneProgress(camp).title ?? null) === id) return camp
  return { ...camp, milestones: { ...milestoneProgress(camp), title: id } }
}
