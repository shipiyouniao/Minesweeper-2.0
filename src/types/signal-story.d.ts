/** Persistent performances follow actual room outcomes rather than menu clicks. */
export type SignalSceneId =
  'tower-response' | 'entry' | 'connected' | 'archive' | 'record' | 'prison' | 'rescued' | 'camp'
export type SignalSpeaker = 'player' | 'lumi' | 'nia' | 'guardian' | 'toma'

/** A compact localized exchange uses the existing chibi and voiced typewriter language. */
export interface SignalLine {
  readonly speaker: SignalSpeaker
  readonly text: string
}

/** Copy includes concrete action instructions and optional objectives. */
export interface SignalCopy {
  readonly title: string
  readonly floors: readonly string[]
  readonly relay: string
  readonly gate: string
  readonly released: string
  readonly ready: string
  readonly solve: string
  readonly record: string
  readonly optional: string
  readonly continue: string
  readonly nia: string
  readonly player: string
  readonly lumi: string
  readonly guardian: string
  readonly complete: string
}
