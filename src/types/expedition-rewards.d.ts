/** Final banked supplies separate the original settlement from its difficulty bonus. */
export interface ExpeditionReward {
  readonly base: number
  readonly bonus: number
  readonly total: number
  readonly percent: number
}
