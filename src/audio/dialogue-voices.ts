import type { DialogueCue, SoundCue, Tone } from '../types/audio.js'
import type { EncounterKind } from '../types/tactical.js'
import type { Profession } from '../types/variants.js'

/** Speech cues remain identifiable without expanding the browser audio port per character. */
export function isDialogueCue(cue: SoundCue): cue is DialogueCue {
  return cue.startsWith('dialogue-')
}

/** A short voiced syllable has a soft attack, pitch movement and bounded volume. */
function syllable(
  frequency: number,
  endFrequency: number,
  gain: number,
  waveform: 'sine' | 'triangle' = 'sine',
  duration = 0.03,
): Tone {
  return { frequency, endFrequency, gain, waveform, duration, delay: 0 }
}

/** Original character motifs: the existing voices are about 4–5 dB louder. */
export function dialogueTone(cue: DialogueCue): Tone {
  switch (cue) {
    case 'dialogue-player':
      return syllable(980, 1120, 0.032)
    case 'dialogue-lumi':
      return syllable(720, 880, 0.035, 'triangle', 0.034)
    case 'dialogue-nia':
      return syllable(890, 700, 0.036, 'triangle', 0.032)
    case 'dialogue-narrator':
      return syllable(580, 580, 0.024)
    case 'dialogue-boss':
      return syllable(260, 190, 0.04, 'triangle', 0.04)
    case 'dialogue-surveyor':
      return syllable(1080, 960, 0.031)
    case 'dialogue-engineer':
      return syllable(460, 520, 0.036, 'triangle')
    case 'dialogue-archaeologist':
      return syllable(660, 610, 0.034, 'triangle', 0.036)
    case 'dialogue-alchemist':
      return syllable(850, 1120, 0.031, 'triangle')
    case 'dialogue-sentinel':
      return syllable(360, 320, 0.039, 'triangle', 0.038)
    case 'dialogue-waymarker':
      return syllable(1180, 1020, 0.03)
    case 'dialogue-riftwalker':
      return syllable(640, 840, 0.034)
    case 'dialogue-brood':
      return syllable(410, 280, 0.037, 'triangle', 0.035)
    case 'dialogue-mirror':
      return syllable(920, 780, 0.033, 'triangle')
    case 'dialogue-magnetic':
      return syllable(180, 360, 0.041, 'triangle', 0.04)
    case 'dialogue-clock':
      return syllable(1240, 1240, 0.031, 'triangle', 0.025)
    case 'dialogue-echo':
      return syllable(540, 740, 0.036, 'sine', 0.042)
    case 'dialogue-matrix':
      return syllable(1460, 1160, 0.03, 'sine', 0.026)
    case 'dialogue-tide':
      return syllable(320, 220, 0.04, 'sine', 0.045)
  }
}

/** Freeze dialogue identity to the same profession represented by the on-screen portrait. */
export function playerDialogueCue(profession: Profession): DialogueCue {
  switch (profession) {
    case 'explorer':
      return 'dialogue-player'
    case 'surveyor':
      return 'dialogue-surveyor'
    case 'engineer':
      return 'dialogue-engineer'
    case 'archaeologist':
      return 'dialogue-archaeologist'
    case 'alchemist':
      return 'dialogue-alchemist'
    case 'sentinel':
      return 'dialogue-sentinel'
    case 'waymarker':
      return 'dialogue-waymarker'
    case 'riftwalker':
      return 'dialogue-riftwalker'
  }
}

/** Each boss family has its own audible silhouette instead of sharing one low beep. */
export function bossDialogueCue(kind: EncounterKind): DialogueCue {
  switch (kind) {
    case 'bastion':
      return 'dialogue-boss'
    case 'brood':
      return 'dialogue-brood'
    case 'mirror':
      return 'dialogue-mirror'
    case 'magnetic':
      return 'dialogue-magnetic'
    case 'clock':
      return 'dialogue-clock'
    case 'echo':
      return 'dialogue-echo'
    case 'matrix':
      return 'dialogue-matrix'
    case 'tide':
      return 'dialogue-tide'
  }
}
