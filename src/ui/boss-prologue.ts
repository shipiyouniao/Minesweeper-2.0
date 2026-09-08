import { sharedStyles } from './shared-styles.js'
import { DialogueReveal } from './dialogue-reveal.js'
import type { SoundEffects } from '../types/audio.js'
import { guidanceStyles } from './guidance-styles.js'
import { message } from '../i18n.js'
import { bossScript } from './boss-scripts.js'
import { spriteImage } from './dungeon-sprites.js'
import { professionSprite } from './profession-presentation.js'

import type { PrologueScript } from '../types/guidance.js'
import type { Language } from '../types/localization.js'
import type { Expedition } from '../types/variants.js'

/** Presentation-only arrival scenes never mutate a turn, AP, clues, rewards or the game journal. */
export class BossPrologue {
  private dialog: HTMLDialogElement | null = null
  private events: AbortController | null = null
  private readonly seen = new Set<string>()
  private beat = 0
  private readonly reveal: DialogueReveal

  private readonly sounds: SoundEffects

  /** Share the game's sound preference and already unlocked audio context. */
  constructor(sounds: SoundEffects) {
    this.sounds = sounds
    this.reveal = new DialogueReveal(sounds)
  }

  /** Open an unseen arrival scene, or replay it on request, without advancing the encounter. */
  present(
    root: HTMLElement,
    run: Expedition | null,
    language: Language,
    blocked: boolean,
    force = false,
  ): void {
    if (!run?.encounter || run.phase !== 'boss' || this.dialog?.open || blocked) return
    const key = `minesweeper.prologue:${run.departure.seed}:${run.floor}:${run.encounter.kind}`
    let stored = false
    try {
      stored = sessionStorage.getItem(key) === 'seen'
    } catch {
      /* Storage is optional for presentation. */
    }
    if (!force && (run.encounter.turn > 1 || this.seen.has(key) || stored)) return
    this.dispose()
    this.beat = 0
    const script = bossScript(run.encounter.kind, language)
    const dialog = document.createElement('dialog')
    dialog.className = `prologue-dialog ${guidanceStyles['prologue-dialog']}`
    dialog.dataset['prologue'] = script.kind
    dialog.setAttribute('aria-labelledby', 'prologue-title')
    root.append(dialog)
    this.dialog = dialog
    this.events = new AbortController()
    const signal = this.events.signal
    const close = (): void => {
      this.seen.add(key)
      try {
        sessionStorage.setItem(key, 'seen')
      } catch {
        /* The in-memory set still prevents repeated arrivals. */
      }
      dialog.close()
    }
    dialog.addEventListener(
      'click',
      (event) => {
        event.stopPropagation()
        const button =
          event.target instanceof Element ? event.target.closest<HTMLElement>('[data-scene]') : null
        if (!button) return
        this.sounds.unlock()
        const action = button.dataset['scene']
        if (action === 'next' && this.reveal.finish()) return
        if (action === 'skip' || (action === 'next' && this.beat === script.beats.length - 1)) {
          close()
          return
        }
        if (action === 'previous') this.beat = Math.max(0, this.beat - 1)
        if (action === 'next') this.beat = Math.min(script.beats.length - 1, this.beat + 1)
        this.render(run, script, language)
        dialog.querySelector<HTMLElement>('[data-scene="next"]')?.focus({ preventScroll: true })
      },
      { signal },
    )
    dialog.addEventListener(
      'keydown',
      (event) => {
        event.stopPropagation()
      },
      { signal },
    )
    dialog.addEventListener(
      'cancel',
      (event) => {
        event.preventDefault()
        close()
      },
      { signal },
    )
    dialog.addEventListener(
      'close',
      () => {
        this.seen.add(key)
        this.dispose()
        root.querySelector<HTMLElement>('[data-control="end-turn"]')?.focus({ preventScroll: true })
      },
      { signal },
    )
    this.render(run, script, language)
    dialog.showModal()
    dialog.querySelector<HTMLElement>('[data-scene="next"]')?.focus({ preventScroll: true })
  }

  /** Release the scene dialog and its listeners when closing or replacing the view. */
  dispose(): void {
    this.reveal.cancel()
    this.events?.abort()
    this.events = null
    this.dialog?.remove()
    this.dialog = null
  }

  /** Present the current dialogue beat and public arena landmarks for the selected language. */
  private render(run: Expedition, script: PrologueScript, language: Language): void {
    if (!this.dialog || !run.encounter) return
    const beat = script.beats[this.beat]!

    const e = run.encounter
    const objectives =
      e.kind === 'matrix'
        ? e.prisms.map((prism) => prism.index)
        : e.kind === 'magnetic'
          ? e.anchors.map((a) => a.index)
          : e.kind === 'clock'
            ? e.hourglasses.map((a) => a.index)
            : e.kind === 'bastion'
              ? e.pylons.map((p) => p.index)
              : e.kind === 'brood'
                ? e.nests
                : e.kind === 'echo'
                  ? e.bodies
                  : [e[e.active].seal.index]
    const speaker =
      beat.speaker === 'boss'
        ? script.title
        : beat.speaker === 'player'
          ? ''
          : message(language, 'boss-prologue.at-the-threshold')
    this.dialog.dataset['focus'] = beat.focus
    const line =
      beat.speaker === 'player'
        ? message(language, 'boss-prologue.label', { p0: beat.line })
        : beat.line
    this.dialog.innerHTML = `<header class="prologue-header ${guidanceStyles['prologue-header']}"><div><span class="guidance-eyebrow ${guidanceStyles['guidance-eyebrow']}">ENCOUNTER / ${String(['bastion', 'brood', 'mirror', 'magnetic', 'clock', 'echo', 'matrix'].indexOf(script.kind) + 1).padStart(2, '0')}</span><h2 id="prologue-title">${script.title}</h2><p>${script.subtitle}</p></div><button class="text-button ${sharedStyles['text-button']}" data-scene="skip">${message(language, 'boss-prologue.skip-arrival')} ↗</button></header><div class="prologue-stage ${guidanceStyles['prologue-stage']}"><div class="scene-aura"></div><div class="scene-portrait ${guidanceStyles['scene-portrait']} scene-hero">${spriteImage(professionSprite(run.departure.profession))}<span>${message(language, 'boss-prologue.explorer')}</span></div><div class="scene-map" style="--scene-columns:${run.game.config.width}">${run.game.cells.map((cell, index) => `<span class="scene-tile ${(e.kind === 'echo' ? e.bodies.includes(index) : index === e.boss) ? 'scene-boss' : index === run.player ? 'scene-player' : objectives.includes(index) ? 'scene-objective' : ''} ${cell.visibility === 'revealed' ? 'scene-open' : ''}">${(e.kind === 'echo' ? e.bodies.includes(index) : index === e.boss) ? spriteImage(script.sprite) : index === run.player ? spriteImage(professionSprite(run.departure.profession)) : objectives.includes(index) ? spriteImage(script.prop) : cell.visibility === 'revealed' && cell.adjacent ? (e.kind === 'matrix' ? '' : e.kind === 'echo' ? '≈' : cell.adjacent) : ''}</span>`).join('')}</div><div class="scene-portrait ${guidanceStyles['scene-portrait']} scene-enemy">${spriteImage(script.sprite)}<span>${script.title}</span></div></div><section class="prologue-dialogue ${guidanceStyles['prologue-dialogue']}" data-speaker="${beat.speaker}"><div class="dialogue-portrait ${guidanceStyles['dialogue-portrait']}">${spriteImage(beat.speaker === 'player' ? professionSprite(run.departure.profession) : beat.speaker === 'boss' ? script.sprite : script.prop)}</div><div>${speaker ? `<strong>${speaker}</strong>` : ''}<p role="status" data-dialogue-line>${line}</p></div></section><footer class="prologue-footer ${guidanceStyles['prologue-footer']}"><button class="text-button ${sharedStyles['text-button']}" data-scene="previous" ${this.beat === 0 ? 'disabled' : ''}>← ${message(language, 'boss-prologue.previous')}</button><span>${String(this.beat + 1).padStart(2, '0')} <i>/ ${script.beats.length}</i></span><button class="primary-button ${sharedStyles['primary-button']}" data-scene="next">${this.beat === script.beats.length - 1 ? message(language, 'boss-prologue.enter-battle') : message(language, 'boss-prologue.continue')} →</button></footer>`
    const paragraph = this.dialog.querySelector<HTMLElement>('[data-dialogue-line]')
    if (paragraph)
      this.reveal.start(
        paragraph,
        line,
        beat.speaker === 'player'
          ? 'dialogue-player'
          : beat.speaker === 'boss'
            ? 'dialogue-boss'
            : 'dialogue-narrator',
        language,
      )
  }
}
