/** Complete combat copy, kept separate from ordinary dungeon instructions. */
export interface TacticalMessages {
  readonly name: string
  readonly turn: string
  readonly points: string
  readonly armor: string
  readonly exposed: string
  readonly pylon: string
  readonly disabled: string
  readonly danger: string
  readonly attack: string
  readonly brace: string
  readonly end: string
  readonly hint: string
  readonly help: readonly string[]
  readonly excavation: string
  readonly victory: string
}
