import type { SoundCue, Tone } from '../types/audio.js'
import type { Game } from '../types/game.js'

/** Choose one cue per accepted action; outcome cues take priority over cell changes. */
export function cueForMove(before: Game, after: Game, index: number): SoundCue | null {
  if (before === after) {
    return null
  }

  if (after.phase === 'won') return 'win'
  if (after.phase === 'lost') return 'loss'

  const previous = before.cells[index]
  const current = after.cells[index]

  if (!previous || !current) return null
  if (current.visibility === 'flagged') return 'flag'
  if (previous.visibility === 'flagged') return 'unflag'

  return 'reveal'
}

/** Build a quiet sine note with a rounded attack and short decay. */
function note(frequency: number, delay = 0, duration = 0.09): Tone {
  return { frequency, endFrequency: frequency, delay, duration, gain: 0.075 }
}

/** Compose original, lightweight cues without recordings, downloads, or runtime randomness. */
export function notesForCue(cue: SoundCue): readonly Tone[] {
  switch (cue) {
    case 'tap':
      return [{ ...note(520, 0, 0.045), gain: 0.04 }]
    case 'reveal':
      return [{ ...note(880, 0, 0.07), endFrequency: 660 }]
    case 'flag':
      return [note(660), note(990, 0.055)]
    case 'unflag':
      return [note(660), note(440, 0.045)]
    case 'win':
      return [note(523.25), note(659.25, 0.08), note(783.99, 0.16), note(1046.5, 0.24, 0.2)]
    case 'loss':
      return [{ ...note(180, 0, 0.24), endFrequency: 80, gain: 0.09 }]
  }
}
