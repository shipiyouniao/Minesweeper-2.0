/** Only the two delegated input adapters may name toolbar commands. */
export type BoardControlAttribute = 'data-action' | 'data-control'

/** Every mode has a short, complete pointer instruction in each language. */
export interface BoardControlsCopy {
  readonly label: string
  readonly reveal: string
  readonly flag: string
  readonly safe: string
  readonly chord: string
  readonly gestures: string
}
