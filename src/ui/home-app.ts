import type { Language } from '../types/localization.js'
import type { MenuPage } from '../types/navigation.js'
import type { InteractionCue, SoundEffects } from '../types/audio.js'
import type { GameRepository } from '../types/storage.js'
import type { MountedGame } from '../types/variants.js'
import { homeTemplate } from './home-template.js'
import { LanguageMenu } from './language-menu.js'
import { message } from '../i18n.js'

/** Own menu settings and their listeners without starting, resuming or timing any game. */
export class HomeApp implements MountedGame {
  private menu: LanguageMenu | null = null
  private readonly listeners = new AbortController()
  private readonly root: HTMLElement
  private readonly page: MenuPage
  private language: Language
  private readonly preferences: GameRepository
  private readonly sounds: SoundEffects
  private readonly onLanguage: (language: Language) => void

  /** Mount a menu using the same persisted preferences and audio adapter as game screens. */
  constructor(
    root: HTMLElement,
    page: MenuPage,
    language: Language,
    preferences: GameRepository,
    sounds: SoundEffects,
    onLanguage: (language: Language) => void,
  ) {
    this.root = root
    this.page = page
    this.language = language
    this.preferences = preferences
    this.sounds = sounds
    this.onLanguage = onLanguage
    this.render()
    root.addEventListener('click', this.click, { signal: this.listeners.signal })
    root.addEventListener('keydown', this.key, { signal: this.listeners.signal })
  }

  /** Release document-level menu listeners and audio when a destination is entered. */
  dispose(): void {
    this.listeners.abort()
    this.menu?.dispose()
    this.sounds.dispose()
  }

  /** Repaint only this settings screen; saved games are never read or rewritten here. */
  private render(): void {
    this.menu?.dispose()
    document.documentElement.lang = this.language === 'zh' ? 'zh-CN' : this.language
    document.title =
      this.page === 'home'
        ? 'Minesweeper 2.0'
        : `${message(this.language, 'home.free')} · Minesweeper 2.0`
    this.root.innerHTML = homeTemplate(this.page, this.language, this.sounds.enabled)
    const picker = this.root.querySelector<HTMLElement>('.language-picker')
    if (!picker) throw new Error('Home language picker is missing')
    this.menu = new LanguageMenu(picker, this.selectLanguage, this.feedback)
  }

  /** Persist the chosen language and leave keyboard focus on the translated menu trigger. */
  private readonly selectLanguage = (language: Language): void => {
    this.language = language
    this.preferences.setPreference({ key: 'language', value: language })
    const url = new URL(location.href)
    url.searchParams.set('lang', language)
    history.replaceState(null, '', url)
    this.onLanguage(language)
    this.render()
    this.menu?.focus()
    this.sounds.play('confirm')
  }

  /** Apply the same mute setting across the homepage and every independent mode. */
  private readonly click = (event: MouseEvent): void => {
    if (!(event.target instanceof Element) || !event.target.closest('[data-home-sound]')) return
    this.sounds.setEnabled(!this.sounds.enabled)
    this.preferences.setPreference({ key: 'sound', value: this.sounds.enabled })
    this.render()
    this.root.querySelector<HTMLButtonElement>('[data-home-sound]')?.focus()
    this.sounds.play('confirm')
  }

  /** Keep keyboard traversal audible without replacing native link activation. */
  private readonly key = (event: KeyboardEvent): void => {
    if (event.key === 'Tab') this.sounds.play('navigate')
  }

  /** Share menu feedback through the current mute-aware sound adapter. */
  private readonly feedback = (cue: InteractionCue): void => {
    this.sounds.play(cue)
  }
}
