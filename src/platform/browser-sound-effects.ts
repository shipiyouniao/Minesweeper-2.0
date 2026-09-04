import type { AudioVoice, SoundCue, SoundEffects } from '../types/audio.js'
import { cuePriority, notesForCue } from '../audio/cues.js'
import { scheduleTone } from './audio-synthesis.js'

/** Owns a lazy audio context; the application remains playable without Web Audio. */
export class BrowserSoundEffects implements SoundEffects {
  private context: AudioContext | null = null
  private readonly voices = new Set<AudioVoice>()
  private active: boolean
  private disposed = false
  private generation = 0
  private lastStart = -Infinity
  private lastCue: SoundCue = 'tap'

  /** Read the saved preference without creating a context or starting playback. */
  constructor(enabled: boolean) {
    this.active = enabled
  }

  /** Report the user's setting independently of browser autoplay restrictions. */
  get enabled(): boolean {
    return this.active
  }

  /** Request activation synchronously inside a pointer or keyboard gesture. */
  unlock(): void {
    const context = this.contextForGesture()

    if (context && context.state !== 'running') {
      void context.resume().catch(() => {})
    }
  }

  /** Resume if necessary, discarding delayed playback after muting or backgrounding. */
  play(cue: SoundCue): void {
    const context = this.contextForGesture()
    if (!context) return

    const generation = this.generation

    if (context.state === 'running') {
      this.schedule(context, cue)
    } else {
      void context
        .resume()
        .then(() => {
          if (
            generation === this.generation &&
            this.active &&
            !this.disposed &&
            context.state === 'running'
          ) {
            this.schedule(context, cue)
          }
        })
        .catch(() => {})
    }
  }

  /** Muting cancels scheduled notes as well as any pending activation promise. */
  setEnabled(enabled: boolean): void {
    this.active = enabled

    if (!enabled) this.stop()
  }

  /** Fade voices quickly instead of cutting an oscillator at an arbitrary sample. */
  stop(): void {
    this.generation += 1
    this.lastStart = -Infinity

    for (const voice of this.voices) {
      this.release(voice)
    }

    this.voices.clear()
  }

  /** Close the device connection and invalidate every pending continuation. */
  dispose(): void {
    this.stop()
    this.disposed = true

    if (this.context && this.context.state !== 'closed') {
      void this.context.close().catch(() => {})
    }

    this.context = null
  }

  /** Create audio only after user input; unsupported or blocked devices are optional. */
  private contextForGesture(): AudioContext | null {
    if (!this.active || this.disposed || typeof AudioContext === 'undefined') return null

    try {
      this.context ??= new AudioContext({ latencyHint: 'interactive' })
      return this.context.state === 'closed' ? null : this.context
    } catch {
      return null
    }
  }

  /** Bound rapid input and polyphony while keeping the final result audible. */
  private schedule(context: AudioContext, cue: SoundCue): void {
    const terminal = cue === 'win' || cue === 'loss'

    if (context.currentTime - this.lastStart < 0.035) {
      if (cuePriority(cue) <= cuePriority(this.lastCue)) return

      // An outside menu click can also reveal a cell: its gameplay cue must win.
      this.stop()
    }

    if (terminal) this.stop()

    this.lastStart = context.currentTime
    this.lastCue = cue

    for (const tone of notesForCue(cue)) {
      // Eight quiet voices leave headroom even during rapid flagging.
      if (this.voices.size >= 8) {
        const oldest = this.voices.values().next().value
        if (oldest) this.release(oldest)
      }

      const voice = scheduleTone(context, tone, context.currentTime)
      this.voices.add(voice)
      voice.oscillator.addEventListener('ended', () => this.voices.delete(voice), { once: true })
    }
  }

  /** Cancel future envelopes and let a brief release reach silence before disconnecting. */
  private release(voice: AudioVoice): void {
    const now = this.context?.currentTime ?? 0
    const gain = voice.envelope.gain

    // Some browsers implement Web Audio without cancelAndHoldAtTime.
    if (typeof gain.cancelAndHoldAtTime === 'function') {
      gain.cancelAndHoldAtTime(now)
    } else {
      const level = gain.value
      gain.cancelScheduledValues(now)
      gain.setValueAtTime(level, now)
    }

    gain.linearRampToValueAtTime(0, now + 0.012)
    voice.oscillator.stop(now + 0.015)
    this.voices.delete(voice)
  }
}
