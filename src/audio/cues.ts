import type { SoundCue, Tone } from '../types/audio.js'
import type { Game } from '../types/game.js'
import type { Vitality } from '../types/vitality.js'

/** Describe visible resource changes only; audio must never inspect an unrevealed cell. */
export function cueForVitality(before: Vitality, after: Vitality): SoundCue | null {
  if (after.health < before.health) return after.health === 0 ? 'loss' : 'damage'
  if (after.shields !== before.shields) return 'shield'
  if (after.health > before.health) return 'heal'

  return null
}

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
    case 'magnet-pull':
      return [{ ...note(180, 0, 0.3), endFrequency: 740, gain: 0.045 }, note(880, 0.24, 0.12)]
    case 'magnet-push':
      return [{ ...note(780, 0, 0.3), endFrequency: 160, gain: 0.045 }, note(220, 0.24, 0.12)]
    case 'magnet-charge':
      return [
        { ...note(140, 0, 0.38), endFrequency: 990, gain: 0.05 },
        { ...note(440, 0.32, 0.16), endFrequency: 110 },
      ]
    case 'navigate':
      return [{ ...note(740, 0, 0.025), gain: 0.018 }]
    case 'input':
      return [{ ...note(620, 0, 0.025), gain: 0.015 }]
    case 'dismiss':
      return [{ ...note(440, 0, 0.05), endFrequency: 330, gain: 0.035 }]
    case 'blocked':
      return [{ ...note(240, 0, 0.055), gain: 0.035 }]
    case 'confirm':
      return [note(740, 0, 0.06), note(990, 0.04, 0.08)]
    case 'tap':
      return [{ ...note(520, 0, 0.045), gain: 0.04 }]
    case 'reveal':
      return [{ ...note(880, 0, 0.07), endFrequency: 660 }]
    case 'flag':
      return [note(660), note(990, 0.055)]
    case 'unflag':
      return [note(660), note(440, 0.045)]
    case 'damage':
      return [{ ...note(300, 0, 0.14), endFrequency: 120, gain: 0.08 }]
    case 'shield':
      return [note(1100, 0, 0.06), note(740, 0.05, 0.12)]
    case 'heal':
      return [note(523, 0, 0.1), note(784, 0.08, 0.15)]
    case 'win':
      return [note(523.25), note(659.25, 0.08), note(783.99, 0.16), note(1046.5, 0.24, 0.2)]
    case 'loss':
      return [{ ...note(180, 0, 0.24), endFrequency: 80, gain: 0.09 }]
  }
}

/** Prefer action results over menu dismissal or key feedback from the same gesture. */
export function cuePriority(cue: SoundCue): number {
  switch (cue) {
    case 'navigate':
    case 'input':
    case 'dismiss':
      return 0
    case 'tap':
    case 'blocked':
      return 1
    case 'damage':
    case 'shield':
    case 'magnet-pull':
    case 'magnet-push':
    case 'magnet-charge':
    case 'heal':
    case 'confirm':
    case 'reveal':
    case 'flag':
    case 'unflag':
      return 2
    case 'win':
    case 'loss':
      return 3
  }
}
