/** Each sound describes a public interaction, never a covered board clue. */
export type InteractionCue = 'tap' | 'navigate' | 'dismiss' | 'blocked' | 'input' | 'confirm'

/** Gameplay cues have priority over navigation feedback from the same browser event. */
export type SoundCue =
  | InteractionCue
  | 'reveal'
  | 'flag'
  | 'unflag'
  | 'win'
  | 'loss'
  | 'damage'
  | 'shield'
  | 'heal'
  | 'magnet-pull'
  | 'magnet-push'
  | 'magnet-charge'

/** A short oscillator envelope, expressed in seconds and hertz. */
export interface Tone {
  readonly frequency: number
  readonly endFrequency: number
  readonly delay: number
  readonly duration: number
  readonly gain: number
}

/** Browser resources owned by one scheduled note. */
export interface AudioVoice {
  readonly oscillator: OscillatorNode
  readonly envelope: GainNode
}

/** Application audio port; the browser adapter owns activation and resource cleanup. */
export interface SoundEffects {
  readonly enabled: boolean

  /** Resume audio within an actual user gesture, including the start of a touch hold. */
  unlock(): void

  /** Play one short cue when enabled; unavailable audio must not interrupt the game. */
  play(cue: SoundCue): void

  /** Change the preference and immediately silence any notes when muted. */
  setEnabled(enabled: boolean): void

  /** Cancel active and pending sounds when the page leaves the foreground. */
  stop(): void

  /** Release the audio context and all voices on teardown or hot reload. */
  dispose(): void
}
