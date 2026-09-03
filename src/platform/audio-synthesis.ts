import type { AudioVoice, Tone } from '../types/audio.js'

/** Schedule one sine envelope on either a live or offline Web Audio context. */
export function scheduleTone(context: BaseAudioContext, tone: Tone, start: number): AudioVoice {
  const oscillator = context.createOscillator()
  const envelope = context.createGain()
  const begins = start + tone.delay
  const ends = begins + tone.duration

  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(tone.frequency, begins)
  oscillator.frequency.exponentialRampToValueAtTime(tone.endFrequency, ends)

  // Start and finish at silence to avoid clicks at either edge of the note.
  envelope.gain.setValueAtTime(0, begins)
  envelope.gain.linearRampToValueAtTime(tone.gain, begins + 0.008)
  envelope.gain.exponentialRampToValueAtTime(0.0001, ends - 0.005)
  envelope.gain.linearRampToValueAtTime(0, ends)

  oscillator.connect(envelope)
  envelope.connect(context.destination)
  oscillator.start(begins)
  oscillator.stop(ends)

  // Both nodes belong to this voice and can be disconnected after its final sample.
  oscillator.addEventListener(
    'ended',
    () => {
      oscillator.disconnect()
      envelope.disconnect()
    },
    { once: true },
  )

  return { oscillator, envelope }
}
