import { RecollectionSession } from '../application/recollection-session.js'
import {
  RECOLLECTION_BOSSES,
  RECOLLECTION_FLOORS,
  validRecollection,
} from '../game/recollection.js'
import { parseVariantDifficulty, variantTier } from '../game/variant-difficulty.js'
import { difficultyRewardPercent } from '../game/expedition-rewards.js'
import { message, translations } from '../i18n.js'
import type { MountedGame } from '../types/variants.js'
import type { SoundEffects } from '../types/audio.js'
import type { Language } from '../types/localization.js'
import type { GameRepository } from '../types/storage.js'
import { difficultyTemplate } from './variant-templates.js'
import { tacticalCopy } from './tactical-copy.js'
import {
  recollectionBossSprite,
  recollectionFloorCopy,
  recollectionLantern,
} from './recollection-copy.js'
import { spriteImage } from './dungeon-sprites.js'
import { professionSprite } from './profession-presentation.js'
import { equipmentCopy, professionCopy, variantCopy } from './variant-copy.js'
import { routeHref } from './navigation.js'
import { escapeHtml } from './presentation.js'

/** Camp preparation edits finite pools; the normal expedition controller plays the resulting run. */
export class RecollectionApp implements MountedGame {
  private readonly listeners = new AbortController()
  private section: 'difficulty' | 'floors' | 'bosses' | null = null
  private readonly close: () => void
  private launching = false
  private launchAnimation: Animation | null = null

  private readonly root: HTMLElement
  private readonly session: RecollectionSession
  private readonly preferences: GameRepository
  private language: Language
  private readonly sounds: SoundEffects

  /** The router supplies the same preferences, wallet and sound owner used by other screens. */
  constructor(
    root: HTMLElement,
    session: RecollectionSession,
    preferences: GameRepository,
    language: Language,
    sounds: SoundEffects,
    close: () => void,
  ) {
    this.close = close
    this.root = root
    this.session = session
    this.preferences = preferences
    this.language = language
    this.sounds = sounds
    root.addEventListener('click', this.click, { signal: this.listeners.signal })
    root.addEventListener('change', this.change, { signal: this.listeners.signal })
    root.addEventListener(
      'cancel',
      (event) => {
        event.preventDefault()
        this.close()
      },
      { signal: this.listeners.signal },
    )
    this.render()
  }

  /** Discard preparation listeners; saved attempts and camp choices belong to their sessions. */
  dispose(): void {
    this.launchAnimation?.cancel()
    this.listeners.abort()
  }

  /** Reuse the established difficulty selector and glass panels, including at narrow widths. */
  private render(): void {
    const language = this.language
    const t = variantCopy(language)
    const session = this.session
    const active = !!session.expedition.run
    const allowed = session.available
    const departure = session.expedition.run?.departure
    const selected = departure?.recollection ?? session.selected
    const unlocked = session.unlocked
    const tier = variantTier(session.expedition.difficulty)
    const loadout = departure ?? session.expedition.loadout
    const focus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement.dataset['recollectionChoice']
        : undefined
    const control =
      document.activeElement instanceof HTMLElement
        ? document.activeElement.dataset['control']
        : undefined
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : language
    document.title = `${message(language, 'recollection.title')} · Minefarer`

    const floors = RECOLLECTION_FLOORS.map((kind) => {
      const copy = recollectionFloorCopy(language, kind)
      const locked = !unlocked.floors.includes(kind)
      return `<label class="recollection-choice ${locked ? 'is-locked' : ''}"><input type="checkbox" data-recollection-choice="floor-${kind}" data-floor="${kind}" ${selected.floors.includes(kind) ? 'checked' : ''} ${locked ? 'disabled' : ''}>${spriteImage(kind === 'ordinary' ? 'exit' : kind === 'relay' ? 'bastion-pylon' : 'workshop')}<span><strong>${copy.name}</strong><small>${locked ? message(language, 'recollection.floor-locked') : copy.note}</small></span></label>`
    }).join('')
    const bosses = RECOLLECTION_BOSSES.map((kind) => {
      const locked = !unlocked.bosses.includes(kind)
      return `<label class="recollection-choice ${locked ? 'is-locked' : ''}"><input type="checkbox" data-recollection-choice="boss-${kind}" data-boss="${kind}" ${selected.bosses.includes(kind) ? 'checked' : ''} ${locked ? 'disabled' : ''}>${spriteImage(recollectionBossSprite(kind))}<span><strong>${tacticalCopy(language, kind).name}</strong>${locked ? `<small>${message(language, 'recollection.boss-locked')}</small>` : ''}</span></label>`
    }).join('')

    const detail =
      this.section === 'difficulty'
        ? `<section class="recollection-difficulty">${difficultyTemplate(language, session.expedition.difficulty, true)}<p>${tier.size} × ${tier.size} · ${message(language, 'camp-copy.count-floors', { count: tier.floors })} · ${t.rewardRate} ×${difficultyRewardPercent(session.expedition.difficulty) / 100}</p></section>`
        : this.section === 'floors'
          ? `<div class="recollection-choices">${floors}</div>`
          : `<div class="recollection-choices recollection-bosses">${bosses}</div>`
    this.root.innerHTML = `<button class="facility-close" data-recollection-close aria-label="${translations[language].close}">×</button><main class="recollection-main">${session.storageAvailable ? '' : `<p role="alert">${message(language, 'story.storage')}</p>`}<header class="recollection-heading">${recollectionLantern()}<div><p class="eyebrow">${message(language, 'recollection.camp')}</p><h1>${message(language, 'recollection.title')}</h1></div></header>
      ${allowed ? `${active && !departure?.recollection ? `<p>${message(language, 'recollection.existing')}</p>` : ''}<fieldset class="recollection-settings" ${active ? 'disabled' : ''}><legend class="sr-only">${message(language, 'recollection.title')}</legend>${this.section ? `<button class="recollection-back" data-recollection-section="back">← ${message(language, 'recollection.back-settings')}</button><h2>${this.section === 'difficulty' ? t.difficulty : this.section === 'floors' ? message(language, 'recollection.floors') : message(language, 'recollection.bosses')}</h2>${detail}` : `<div class="recollection-summary"><button data-recollection-section="difficulty"><span>${t.difficulty}</span><strong>${tier.size} × ${tier.size} · ${message(language, 'camp-copy.count-floors', { count: tier.floors })}</strong><span>›</span></button><button data-recollection-section="floors"><span>${message(language, 'recollection.floors')}</span><strong>${selected.floors.length} / ${unlocked.floors.length}</strong><span>›</span></button><button data-recollection-section="bosses"><span>${message(language, 'recollection.bosses')}</span><strong>${selected.bosses.length} / ${unlocked.bosses.length}</strong><span>›</span></button></div>`}</fieldset><section class="recollection-loadout">${spriteImage(professionSprite(loadout.profession))}<div><h2>${message(language, 'recollection.loadout')}</h2><strong>${professionCopy(language, loadout.profession).name}</strong><p>${escapeHtml(loadout.equipment.map((item) => equipmentCopy(language, item).name).join(' · '))}</p></div></section>` : `<p>${message(language, 'recollection.locked')}</p>`}
      <footer class="recollection-actions"><p role="status">${allowed && !active && !validRecollection(selected, unlocked) ? message(language, 'recollection.choose') : ''}</p>${allowed ? `<button class="story-primary" data-recollection-start ${!active && !validRecollection(selected, unlocked) ? 'disabled' : ''}>${active ? (departure?.recollection ? message(language, 'recollection.resume') : message(language, 'recollection.resume-expedition')) : message(language, 'recollection.begin')}</button>` : ''}</footer></main><a hidden data-route data-recollection-play href="${routeHref({ page: 'game', mode: 'expedition' }, language)}"></a>`
    if (control)
      this.root
        .querySelector<HTMLElement>(`[data-control="${control}"]`)
        ?.focus({ preventScroll: true })
    if (focus)
      this.root
        .querySelector<HTMLInputElement>(`[data-recollection-choice="${focus}"]`)
        ?.focus({ preventScroll: true })
  }

  /** Commit before the lantern ignites; navigation or a reload can safely resume that exact run. */
  private launch(): void {
    if (this.launching) return
    if (!this.session.expedition.run && !this.session.start()) {
      this.sounds.play('blocked')
      this.render()
      return
    }
    this.launching = true
    this.sounds.play('confirm')
    const button = this.root.querySelector<HTMLButtonElement>('[data-recollection-start]')
    if (button) button.disabled = true
    const lantern = this.root.querySelector('.recollection-heading img')
    /** A canceled screen animation cannot navigate away from the player's newer destination. */
    const enter = (): void => {
      if (!this.listeners.signal.aborted)
        this.root.querySelector<HTMLAnchorElement>('[data-recollection-play]')?.click()
    }
    if (!lantern || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      enter()
      return
    }
    this.launchAnimation = lantern.animate(
      [
        { transform: 'scale(1)', filter: 'brightness(1)' },
        { transform: 'scale(1.12)', filter: 'brightness(1.5) drop-shadow(0 0 18px #70d6c6)' },
        { transform: 'scale(1)', filter: 'brightness(1.2)' },
      ],
      { duration: 580, easing: 'ease-in-out', fill: 'forwards' },
    )
    void this.launchAnimation.finished.then(enter, () => {})
  }

  /** Use native checkboxes for keyboard and touch activation, while validating their catalog IDs. */
  private readonly change = (event: Event): void => {
    const input = event.target
    if (!(input instanceof HTMLInputElement) || this.launching) return
    const floor = RECOLLECTION_FLOORS.find((kind) => kind === input.dataset['floor'])
    const boss = RECOLLECTION_BOSSES.find((kind) => kind === input.dataset['boss'])
    const changed = floor
      ? this.session.toggleFloor(floor)
      : boss
        ? this.session.toggleBoss(boss)
        : false
    this.sounds.unlock()
    this.sounds.play(changed ? 'tap' : 'blocked')
    this.render()
  }

  /** Starting and resuming both hand off to the existing board interaction implementation. */
  private readonly click = (event: MouseEvent): void => {
    if (!(event.target instanceof Element)) return
    const button = event.target.closest<HTMLButtonElement>('button')
    if (!button || button.disabled) return
    this.sounds.unlock()
    if (this.launching) return
    if (button.hasAttribute('data-recollection-start')) {
      this.launch()
      return
    }
    if (button.hasAttribute('data-recollection-sound')) {
      this.sounds.setEnabled(!this.sounds.enabled)
      this.preferences.setPreference({ key: 'sound', value: this.sounds.enabled })
      this.render()
      return
    }
    if (button.hasAttribute('data-recollection-close')) {
      this.close()
      return
    }
    const section = button.dataset['recollectionSection']
    if (section) {
      this.section =
        section === 'difficulty' || section === 'floors' || section === 'bosses' ? section : null
      this.render()
      this.root.querySelector<HTMLElement>('[data-recollection-section]')?.focus()
      return
    }
    const control = button.dataset['control']
    const difficulty = control?.startsWith('difficulty:')
      ? parseVariantDifficulty(control.slice(11))
      : null
    if (difficulty) {
      this.sounds.play(this.session.selectDifficulty(difficulty) ? 'tap' : 'blocked')
      this.render()
    }
  }
}
