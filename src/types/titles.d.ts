/** One earned achievement occupies the expedition's single title slot. */
export type TitleId =
  | 'bastion-flawless'
  | 'mirror-flawless'
  | 'clock-no-glass'
  | 'magnetic-demolition'
  | 'brood-nest-spared'
  | 'web-untouched'
  | 'field-unscathed'
  | 'veteran'
  | 'relic-curator'
  | 'boss-slayer'
  | 'four-legends'
  | 'abyss-clear'
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

/** Replayed counters survive room changes; only entering another floor resets its chest guard. */
export interface TitleProgress {
  /** Saturates at three because no title rewards a later chest. */
  readonly chests: number
  readonly floorChest: boolean
}
