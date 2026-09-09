import { playerDialogueCue } from '../audio/dialogue-voices.js'
import { message } from '../i18n.js'
import type { SoundEffects } from '../types/audio.js'
import type { StoryDialogueBeat, StoryReaction, StoryViewState } from '../types/story.js'
import { DialogueReveal } from './dialogue-reveal.js'
import { spriteImage } from './dungeon-sprites.js'
import { professionCopy } from './variant-copy.js'
import { storyDialogue } from './story-dialogue.js'

/** Own cinematic presentation independently of the replay journal and game actions. */
export class StoryPerformance {
  private readonly root: HTMLElement
  private readonly sounds: SoundEffects
  private readonly reveal: DialogueReveal
  private readonly reduced = matchMedia('(prefers-reduced-motion: reduce)')
  private readonly events = new AbortController()
  private readonly animations = new Set<Animation>()
  private curtain: HTMLElement | null = null
  private eyes: Animation[] = []
  private awakening: boolean
  private disposed = false
  private state: StoryViewState | null = null
  private beats: readonly StoryDialogueBeat[] = []
  private key = ''
  private beat = 0
  private paragraph: HTMLElement | null = null
  private typing = false

  /** Only an untouched prologue receives the opening; restored gameplay remains immediate. */
  constructor(root: HTMLElement, sounds: SoundEffects, fresh: boolean) {
    this.root = root
    this.sounds = sounds
    this.reveal = new DialogueReveal(sounds)
    this.awakening = fresh && !this.reduced.matches
    const signal = this.events.signal
    document.addEventListener('visibilitychange', this.quiet, { signal })
    this.reduced.addEventListener('change', this.reduceMotion, { signal })
  }

  /** The short opening captures its own skip gesture, never a board action underneath. */
  get busy(): boolean {
    return this.awakening
  }

  /** Reattach the same paragraph on ordinary renders so toggling tools never restarts speech. */
  present(state: StoryViewState): void {
    this.state = state
    const paragraph = this.root.querySelector<HTMLElement>('[data-story-dialogue-line]')
    if (!paragraph) {
      this.reveal.cancel()
      this.paragraph = null
      this.key = ''
      return
    }
    const beats = storyDialogue(state)
    const key = `${state.language}:${state.run ? 'explorer' : state.loadout.profession}:${state.board.scene.id}:${beats.map((b) => `${b.speaker}:${b.line}`).join('\n')}`
    if (key === this.key && this.paragraph) {
      paragraph.replaceWith(this.paragraph)
      this.updateSpeaker()
      this.updateNext()
      return
    }
    this.reveal.cancel()
    this.beats = beats
    this.key = key
    this.beat = 0
    this.paragraph = paragraph
    this.showBeat()
    if (this.awakening && !this.curtain) this.openEyes()
  }

  /** One click completes typing; a following click advances the exchange without moving a cell. */
  advance(): void {
    if (this.awakening || this.reveal.finish()) return
    if (this.beat + 1 >= this.beats.length) return
    this.beat++
    this.showBeat()
  }

  /** Finish the opening immediately when requested, preserving the current scene and objectives. */
  skipOpening(): void {
    if (!this.awakening) return
    this.awakening = false
    for (const animation of this.eyes) animation.cancel()
    this.eyes = []
    this.curtain?.remove()
    this.curtain = null
    for (const child of this.root.querySelectorAll<HTMLElement>('[data-story-inert]')) {
      child.inert = false
      delete child.dataset['storyInert']
    }
    if (!this.disposed) {
      this.showBeat()
      this.root
        .querySelector<HTMLElement>('[data-story-action="dialogue"]')
        ?.focus({ preventScroll: true })
    }
  }

  /** Give actual meetings and pickups a visible response after their walking animation. */
  react(reaction: StoryReaction): void {
    if (this.reduced.matches || document.hidden) return
    const player = this.root.querySelector<HTMLElement>('.story-traveler')
    if (!player) return
    if (reaction === 'greet') {
      this.animate(
        player,
        [
          { transform: 'translateY(0)' },
          { transform: 'translateY(-5px)' },
          { transform: 'translateY(0)' },
        ],
        420,
      )
      const guide = this.root.querySelector<HTMLElement>('[data-story-cell="51"] .story-guide')
      if (guide)
        this.animate(
          guide,
          [
            { transform: 'rotate(0)' },
            { transform: 'rotate(-12deg)' },
            { transform: 'rotate(8deg)' },
            { transform: 'rotate(0)' },
          ],
          650,
        )
      return
    }
    const gift = document.createElement('span')
    gift.className = 'story-gift'
    gift.setAttribute('aria-hidden', 'true')
    gift.innerHTML = spriteImage('treasure')
    gift.style.left = `${player.offsetLeft}px`
    gift.style.top = `${player.offsetTop}px`
    gift.style.width = `${player.offsetWidth}px`
    player.parentElement?.append(gift)
    const animation = this.animate(
      gift,
      [
        { opacity: 0, transform: 'translateY(0) scale(.6)' },
        { opacity: 1, transform: 'translateY(-20px) scale(1)' },
        { opacity: 0, transform: 'translateY(-45px) scale(.7)' },
      ],
      900,
    )
    void animation.finished.then(
      () => gift.remove(),
      () => gift.remove(),
    )
  }

  /** Cancel every timer and animation when routing away; no detached speaker keeps sounding. */
  dispose(): void {
    this.disposed = true
    this.events.abort()
    this.reveal.cancel()
    this.skipOpening()
    for (const animation of this.animations) animation.cancel()
    this.animations.clear()
    this.paragraph = null
  }

  /** Fill speaker identity before typing; dialogue progression changes no game state. */
  private showBeat(): void {
    const state = this.state
    const beat = this.beats[this.beat]
    if (!state || !beat || !this.paragraph) return
    this.updateSpeaker()
    this.paragraph.textContent = beat.line
    if (this.awakening) return
    this.typing = true
    this.updateNext()
    this.reveal.start(
      this.paragraph,
      beat.line,
      beat.speaker === 'lumi'
        ? 'dialogue-lumi'
        : playerDialogueCue(state.run ? 'explorer' : state.loadout.profession),
      state.language,
      () => {
        this.typing = false
        this.updateNext()
      },
    )
    if (!this.reduced.matches && !document.hidden) {
      const portrait = this.root.querySelector<HTMLElement>(
        `[data-story-speaker="${beat.speaker}"]`,
      )
      if (portrait) {
        const angle = beat.gesture === 'point' || beat.gesture === 'greet' ? -8 : 3
        this.animate(
          portrait,
          [
            { transform: 'translateY(5px) rotate(0)' },
            { transform: `translateY(-3px) rotate(${angle}deg)` },
            { transform: 'translateY(0) rotate(0)' },
          ],
          440,
        )
      }
      if (beat.gesture === 'offer') this.offerBag()
    }
  }

  /** Pass the recovered bag between the two portraits when the arrival exchange acknowledges it. */
  private offerBag(): void {
    const speakers = this.root.querySelector<HTMLElement>('.story-speakers')
    if (!speakers) return
    const bag = document.createElement('span')
    bag.className = 'story-handover'
    bag.setAttribute('aria-hidden', 'true')
    bag.innerHTML = spriteImage('treasure')
    speakers.append(bag)
    const animation = this.animate(
      bag,
      [
        { opacity: 0, transform: 'translate(0, 8px) scale(.7)' },
        { opacity: 1, transform: 'translate(10px, -8px) scale(1)', offset: 0.4 },
        { opacity: 0, transform: 'translate(38px, 8px) scale(.7)' },
      ],
      950,
    )
    void animation.finished.then(
      () => bag.remove(),
      () => bag.remove(),
    )
  }

  /** Keep the active and listening portraits clear at every viewport width. */
  private updateSpeaker(): void {
    const state = this.state
    const beat = this.beats[this.beat]
    if (!state || !beat) return
    const name = this.root.querySelector<HTMLElement>('[data-story-speaker-name]')
    if (name)
      name.textContent =
        beat.speaker === 'lumi'
          ? message(state.language, 'story.guide')
          : professionCopy(state.language, state.run ? 'explorer' : state.loadout.profession).name
    for (const portrait of this.root.querySelectorAll<HTMLElement>('[data-story-speaker]'))
      portrait.dataset['active'] = String(portrait.dataset['storySpeaker'] === beat.speaker)
  }

  /** The final button can finish a long line; it never accidentally advances the floor. */
  private updateNext(): void {
    const button = this.root.querySelector<HTMLButtonElement>('[data-story-action="dialogue"]')
    if (!button || !this.state) return
    const more = this.beat + 1 < this.beats.length
    button.hidden = !this.typing && !more
    button.textContent = `${more ? message(this.state.language, 'story.dialogue-next') : message(this.state.language, 'story.dialogue-read')} →`
  }

  /** Eyelids briefly blink, widen, then bring the live scene into focus. */
  private openEyes(): void {
    const state = this.state
    if (!state) return
    const curtain = document.createElement('div')
    curtain.className = 'story-awakening'
    curtain.innerHTML = `<div class="story-eyelid story-eyelid-top"></div><div class="story-eyelid story-eyelid-bottom"></div><button data-story-action="wake">${message(state.language, 'story.open-eyes')} ↗</button>`
    this.curtain = curtain
    for (const child of this.root.children) {
      if (!(child instanceof HTMLElement)) continue
      child.inert = true
      child.dataset['storyInert'] = ''
    }
    this.root.append(curtain)
    curtain.querySelector('button')?.focus({ preventScroll: true })
    for (const [index, lid] of [
      ...curtain.querySelectorAll<HTMLElement>('.story-eyelid'),
    ].entries()) {
      const direction = index === 0 ? -1 : 1
      this.eyes.push(
        this.animate(
          lid,
          [
            { transform: 'translateY(0)' },
            { transform: `translateY(${direction * 9}%)`, offset: 0.3 },
            { transform: `translateY(${direction * 2}%)`, offset: 0.42 },
            { transform: `translateY(${direction * 108}%)` },
          ],
          2200,
        ),
      )
    }
    const scene = this.root.querySelector<HTMLElement>('.story-main')
    if (scene)
      this.eyes.push(
        this.animate(
          scene,
          [
            { filter: 'blur(9px)', opacity: 0.45 },
            { filter: 'blur(4px)', opacity: 0.8, offset: 0.65 },
            { filter: 'blur(0)', opacity: 1 },
          ],
          2200,
        ),
      )
    void this.eyes[0]!.finished.then(
      () => this.skipOpening(),
      () => {},
    )
  }

  /** Track short-lived Web Animations so route changes and accessibility settings can stop them. */
  private animate(element: HTMLElement, frames: Keyframe[], duration: number): Animation {
    const animation = element.animate(frames, { duration, easing: 'ease-in-out', fill: 'both' })
    this.animations.add(animation)
    void animation.finished.then(
      () => {
        this.animations.delete(animation)
        animation.cancel()
      },
      () => this.animations.delete(animation),
    )
    return animation
  }

  /** Background pages keep the complete line but stop all speech immediately. */
  private readonly quiet = (): void => {
    if (!document.hidden) return
    this.skipOpening()
    this.reveal.finish()
    this.sounds.stop()
    for (const animation of this.animations) animation.cancel()
  }

  /** Changing the system preference completes presentation without advancing gameplay. */
  private readonly reduceMotion = (): void => {
    if (!this.reduced.matches) return
    this.skipOpening()
    this.reveal.finish()
    for (const animation of this.animations) animation.cancel()
  }
}
