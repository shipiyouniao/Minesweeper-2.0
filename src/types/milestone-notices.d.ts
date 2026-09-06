import type { MilestoneDefinition } from './milestones.js'
export interface MilestoneNotice {
  readonly entry: MilestoneDefinition
  readonly value: number
}
