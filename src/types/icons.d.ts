/** The complete set of original application icons. */
export type Icon =
  | 'flag'
  | 'mine'
  | 'reset'
  | 'pause'
  | 'play'
  | 'clock'
  | 'trophy'
  | 'arrow'
  | 'check'
  | 'close'
  | 'pointer'
  | 'help'
  | 'leaf'
  | 'globe'

/** Each icon has one authored SVG fragment. */
export interface IconPaths {
  readonly flag: string
  readonly mine: string
  readonly reset: string
  readonly pause: string
  readonly play: string
  readonly clock: string
  readonly trophy: string
  readonly arrow: string
  readonly check: string
  readonly close: string
  readonly pointer: string
  readonly help: string
  readonly leaf: string
  readonly globe: string
}
