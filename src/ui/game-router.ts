import { ExpeditionSession } from '../application/expedition-session.js'
import { GameSession } from '../application/game-session.js'
import { TwinSession } from '../application/twin-session.js'
import { difficultyOf } from '../game/difficulty.js'
import { BrowserSoundEffects } from '../platform/browser-sound-effects.js'
import { browserRuntime } from '../platform/browser.js'
import { VariantRepository } from '../persistence/variant-repository.js'
import type { Repository } from '../storage.js'
import type { Language } from '../types/localization.js'
import type { MountedGame, Ruleset } from '../types/variants.js'
import { MinesweeperApp } from './minesweeper-app.js'
import { VariantApp } from './variant-app.js'
import { variantCopy } from './variant-copy.js'

/** Parse public routing input independently from the classic difficulty parameter. */
export function parseRuleset(value: string | null): Ruleset {
  return value === 'expedition' || value === 'twin' ? value : 'classic'
}

/** Owns exactly one mounted game and switches modes without erasing their save slots. */
export class GameRouter implements MountedGame {
  private readonly repository: Repository
  private readonly variants: VariantRepository
  private language: Language
  private readonly navigation: HTMLElement
  private readonly host: HTMLElement
  private readonly listeners = new AbortController()
  private active: MountedGame
  private mode: Ruleset
  private sounds: BrowserSoundEffects | null = null

  /** Construct a persistent ruleset selector above the active game's independent shell. */
  constructor(
    root: HTMLElement,
    repository: Repository,
    variants: VariantRepository,
    language: Language,
  ) {
    this.repository = repository
    this.variants = variants
    this.language = language
    root.innerHTML = '<nav class="ruleset-tabs"></nav><div class="ruleset-host"></div>'
    const navigation = root.querySelector<HTMLElement>('.ruleset-tabs')
    const host = root.querySelector<HTMLElement>('.ruleset-host')
    if (!navigation || !host) throw new Error('Ruleset router markup is incomplete')
    this.navigation = navigation
    this.host = host
    this.mode = parseRuleset(new URLSearchParams(location.search).get('ruleset'))
    this.active = this.mount()
    this.renderNavigation()
    navigation.addEventListener('click', this.select, { signal: this.listeners.signal })
    navigation.addEventListener('keydown', this.navigate, { signal: this.listeners.signal })
  }

  /** Dispose the active game before removing the routing listener. */
  dispose(): void {
    this.listeners.abort()
    this.active.dispose()
  }

  /** Instantiate the appropriate rules/session/view stack from shared browser adapters. */
  private mount(): MountedGame {
    const sounds = new BrowserSoundEffects(this.repository.preferences().sound)
    this.sounds = sounds
    if (this.mode === 'classic') {
      const difficulty = difficultyOf(
        new URLSearchParams(location.search).get('mode') ??
          this.repository.preferences().difficulty,
      )
      return new MinesweeperApp(
        this.host,
        new GameSession(this.repository, browserRuntime, difficulty),
        this.repository,
        this.language,
        sounds,
        this.languageChanged,
      )
    }

    const session =
      this.mode === 'expedition'
        ? new ExpeditionSession(this.variants, browserRuntime)
        : new TwinSession(this.variants, browserRuntime)
    return new VariantApp(
      this.host,
      session,
      this.variants,
      this.repository,
      this.language,
      sounds,
      this.languageChanged,
    )
  }

  /** Repaint only the small mode selector when selection or language changes. */
  private renderNavigation(): void {
    const t = variantCopy(this.language)
    this.navigation.setAttribute('aria-label', t.modes)
    this.navigation.innerHTML = `<span>${t.modes}</span>${(['classic', 'expedition', 'twin'] as const).map((mode) => `<button data-ruleset="${mode}" aria-pressed="${mode === this.mode}">${t[mode]}</button>`).join('')}`
  }

  /** Save and dispose the current mode before activating another independent namespace. */
  private readonly select = (event: MouseEvent): void => {
    const button =
      event.target instanceof Element ? event.target.closest<HTMLElement>('[data-ruleset]') : null
    if (!button) return
    const mode = parseRuleset(button.dataset['ruleset'] ?? null)
    if (mode === this.mode) {
      this.sounds?.play('tap')
      return
    }
    this.active.dispose()
    this.mode = mode
    const url = new URL(location.href)
    url.searchParams.set('ruleset', mode)
    history.replaceState(null, '', url)
    this.active = this.mount()
    this.sounds?.play('tap')
    this.renderNavigation()
    this.navigation.querySelector<HTMLButtonElement>(`[data-ruleset="${mode}"]`)?.focus()
  }

  /** Keep navigation labels in sync with either mounted game's language control. */
  private readonly languageChanged = (language: Language): void => {
    this.language = language
    this.renderNavigation()
  }

  /** Keep mode-selector keyboard traversal on the active game's mute-aware sound port. */
  private readonly navigate = (event: KeyboardEvent): void => {
    if (event.key === 'Tab') this.sounds?.play('navigate')
  }
}
