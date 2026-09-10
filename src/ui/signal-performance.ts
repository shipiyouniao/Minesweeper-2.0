import { bridgeReveal } from './chapter-performance.js'
import { DialogueReveal } from './dialogue-reveal.js'
import { signalCopy, signalLines } from './signal-copy.js'
import { message } from '../i18n.js'
import { spriteImage } from './dungeon-sprites.js'
import { professionSprite } from './profession-presentation.js'
import { playerDialogueCue } from '../audio/dialogue-voices.js'
import type { Language } from '../types/localization.js'
import type { SignalLine, SignalSceneId } from '../types/signal-story.js'
import type { CampaignSceneId } from '../types/campaign.js'
import type { Profession } from '../types/variants.js'
import type { SoundEffects } from '../types/audio.js'

/** Reuse the chibi asset for a board resident and a speaking portrait. */
export function niaImage(): string {
  return `<img class="signal-nia" src="${import.meta.env.BASE_URL}assets/story/nia.png" alt="" width="128" height="128" draggable="false">`
}

/** Own one voiced encounter performance and release every timer on navigation. */
export class SignalPerformance {
  private readonly reveal: DialogueReveal
  private readonly sounds: SoundEffects
  private dialog: HTMLDialogElement | null = null
  private animation: Animation | null = null

  /** Share the same sound activation and mute preference as the game. */
  constructor(sounds: SoundEffects) {
    this.sounds = sounds
    this.reveal = new DialogueReveal(sounds)
  }

  /** Present a reached event; skipping a typing animation never skips the next line. */
  show(
    root: HTMLElement,
    language: Language,
    scene: SignalSceneId,
    record: boolean,
    profession: Profession,
    completed: () => void,
  ): void {
    this.present(root, language, scene, signalLines(language, scene, record), profession, completed)
  }

  /** Stage scripts supply their own reached event; voice, pacing and motion stay shared. */
  present(
    root: HTMLElement,
    language: Language,
    scene: CampaignSceneId,
    lines: readonly SignalLine[],
    profession: Profession,
    completed: () => void,
  ): void {
    if (this.dialog?.isConnected) return
    this.dispose()
    const t = signalCopy(language)
    const dialog = document.createElement('dialog')
    dialog.className = 'signal-dialogue'
    dialog.dataset['signalScene'] = scene
    dialog.setAttribute('aria-labelledby', 'signal-speaker')
    dialog.innerHTML = `<div class="signal-cast"><span data-signal-listener>${spriteImage(professionSprite(profession))}</span><span data-signal-portrait></span></div><div class="signal-dialogue-copy"><strong id="signal-speaker"></strong><p data-signal-line></p><button class="story-dialogue-next" data-signal-next>${t.continue} →</button></div>`
    root.append(dialog)
    if (scene === 'control-restored')
      dialog.querySelector('.signal-cast')!.insertAdjacentHTML('afterend', bridgeReveal(language))
    if (scene === 'pass-open') dialog.classList.add('chapter-guardian-restored')
    if (
      scene === 'ridge-found' ||
      scene === 'ridge-camp' ||
      scene === 'waterway-found' ||
      scene === 'waterway-camp'
    ) {
      const replay = document.createElement('button')
      replay.type = 'button'
      replay.className = 'ridge-recording'
      replay.dataset['beaconReplay'] = ''
      replay.textContent = message(language, 'ridge.recording')
      replay.addEventListener('click', () => {
        this.sounds.unlock()
        this.sounds.play('beacon-signal')
      })
      dialog.querySelector('[data-signal-next]')!.before(replay)
    }
    this.dialog = dialog
    let beat = 0
    const paint = (): void => {
      const line = lines[beat]
      if (!line) return
      this.animation?.cancel()
      const portrait = dialog.querySelector<HTMLElement>('[data-signal-portrait]')!
      const listener = dialog.querySelector<HTMLElement>('[data-signal-listener]')!
      // Keep the person being answered on screen while the player speaks.
      if (line.speaker !== 'player' || !portrait.firstElementChild)
        portrait.innerHTML =
          line.speaker === 'lumi'
            ? `<img src="${import.meta.env.BASE_URL}assets/story/guide.png" alt="" draggable="false">`
            : line.speaker === 'guardian'
              ? spriteImage('bastion')
              : niaImage()
      // The first response has a silhouette; the face is revealed only after reconnecting the line.
      portrait.classList.toggle('signal-radio', scene === 'entry' && line.speaker === 'nia')
      portrait.classList.toggle('is-speaking', line.speaker !== 'player')
      listener.classList.toggle('is-speaking', line.speaker === 'player')
      dialog.querySelector('#signal-speaker')!.textContent = t[line.speaker]
      const active = line.speaker === 'player' ? listener : portrait
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches)
        this.animation = active.animate(
          [
            { transform: 'translateY(0) rotate(0)' },
            { transform: 'translateY(-7px) rotate(-3deg)' },
            { transform: 'translateY(0) rotate(0)' },
          ],
          { duration: 420, easing: 'ease-out' },
        )
      const cue =
        line.speaker === 'player'
          ? playerDialogueCue(profession)
          : line.speaker === 'guardian'
            ? 'dialogue-boss'
            : line.speaker === 'lumi'
              ? 'dialogue-lumi'
              : 'dialogue-nia'
      this.reveal.start(
        dialog.querySelector<HTMLElement>('[data-signal-line]')!,
        line.text,
        cue,
        language,
      )
    }
    dialog.addEventListener('cancel', (event) => event.preventDefault())
    dialog.querySelector('[data-signal-next]')!.addEventListener('click', () => {
      this.sounds.unlock()
      if (this.reveal.finish()) return
      this.sounds.play('confirm')
      if (++beat < lines.length) paint()
      else {
        this.dispose()
        completed()
      }
    })
    dialog.showModal()
    if (scene === 'ridge-found' || scene === 'waterway-call' || scene === 'waterway-found')
      this.sounds.play('beacon-signal')
    paint()
  }

  /** Closing the page cannot leave a detached dialog typing or retaining sound timers. */
  dispose(): void {
    this.reveal.cancel()
    this.animation?.cancel()
    this.animation = null
    this.dialog?.close()
    this.dialog?.remove()
    this.dialog = null
  }
}
