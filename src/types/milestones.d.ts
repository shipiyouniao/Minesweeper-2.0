import type { Relic } from './variants.js'
import type { EncounterKind } from './tactical.js'
import type { TitleId } from './titles.js'

export type MilestoneId =
  | 'hunt-matrix'
  | 'matrix-precise'
  | 'bastion-flawless'
  | 'mirror-flawless'
  | 'echo-flawless'
  | 'echo-precise'
  | 'clock-no-glass'
  | 'magnetic-demolition'
  | 'brood-nest-spared'
  | 'hunt-bastion'
  | 'hunt-brood'
  | 'hunt-mirror'
  | 'hunt-magnetic'
  | 'hunt-clock'
  | 'hunt-echo'
  | 'web-untouched'
  | 'field-unscathed'
  | 'first-steps'
  | 'treasure-scout'
  | 'field-practice'
  | 'floor-runner'
  | 'first-boss'
  | 'veteran'
  | 'relic-curator'
  | 'boss-slayer'
  | 'four-legends'
  | 'abyss-clear'
  | 'trail-apprentice'
  | 'trail-guide'
  | 'cache-runner'
  | 'cache-seeker'
  | 'skill-student'
  | 'skill-adept'
  | 'deep-route'
  | 'deep-descent'
  | 'boss-challenger'
  | 'first-victory'
  | 'long-road'
  | 'world-walker'
  | 'treasure-vault'
  | 'treasure-legend'
  | 'skill-master'
  | 'skill-legend'
  | 'depth-pioneer'
  | 'depth-legend'
  | 'relic-museum'
  | 'abyss-veteran'
export type RewardProfession = 'waymarker' | 'riftwalker'
export type MilestoneRelic =
  | 'trail-heart'
  | 'survey-token'
  | 'chest-beacon'
  | 'pulse-coil'
  | 'last-bastion'
  | 'hunter-seal'
  | 'fault-map'
  | 'abyss-hourglass'
export type MilestoneMetric =
  | 'bossKill'
  | 'challenge'
  | 'travel'
  | 'chests'
  | 'floors'
  | 'bosses'
  | 'skills'
  | 'wins'
  | 'abyssWins'
  | 'relics'
  | 'bossKinds'
export type MilestoneReward =
  | { readonly kind: 'profession'; readonly id: RewardProfession }
  | { readonly kind: 'equipment'; readonly id: 'field-radio' }
  | { readonly kind: 'relic'; readonly id: MilestoneRelic }

/** Finite, authored one-time objectives; claims never depend on wall-clock time. */
export interface MilestoneDefinition {
  readonly id: MilestoneId
  readonly kind: 'missions' | 'achievements'
  readonly bossKind?: EncounterKind
  readonly metric: MilestoneMetric
  readonly target: number
  readonly supplies: number
  readonly reward: MilestoneReward | null
}

/** Cumulative accepted play, stored in the same envelope as the action journal. */
export interface MilestoneProgress {
  readonly challenges?: readonly MilestoneId[]
  readonly attempt?:
    | undefined
    | {
        readonly seed: number
        readonly floor: number
        readonly kind: EncounterKind
        readonly failed: boolean
        readonly hurt: boolean
        readonly glass: boolean
        readonly blasted: boolean
      }
  readonly title?: TitleId | null
  readonly travel: number
  readonly chests: number
  readonly floors: number
  readonly bosses: number
  readonly skills: number
  readonly wins: number
  readonly abyssWins: number
  readonly relics: readonly Relic[]
  readonly bossKinds: readonly EncounterKind[]
  readonly claimed: readonly MilestoneId[]
}
