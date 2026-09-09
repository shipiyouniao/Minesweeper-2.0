import { ExpeditionSession } from '../application/expedition-session.js'
import { GameSession } from '../application/game-session.js'
import { TwinSession } from '../application/twin-session.js'
import { difficultyOf } from '../game/difficulty.js'
import { BrowserSoundEffects } from '../platform/browser-sound-effects.js'
import { browserRuntime } from '../platform/browser.js'
import { VariantRepository } from '../persistence/variant-repository.js'
import type { Repository } from '../storage.js'
import type { Language } from '../types/localization.js'
import type { MountedGame } from '../types/variants.js'
import type { AppRoute } from '../types/navigation.js'
import { MinesweeperApp } from './minesweeper-app.js'
import { VariantApp } from './variant-app.js'
import { SonarSession } from '../application/sonar-session.js'
import type { SonarRepository } from '../persistence/sonar-repository.js'
import { SonarApp } from './sonar-app.js'
import { SurveySession } from '../application/survey-session.js'
import type { SurveyRepository } from '../persistence/survey-repository.js'
import { SurveyApp } from './survey-app.js'
import { parseLanguage } from '../i18n.js'
import { HomeApp } from './home-app.js'
import { StoryApp } from './story-app.js'
import { parseRoute, sameRoute } from './navigation.js'

/** Own exactly one menu or game, checkpointing before navigation and restoring on return. */
export class GameRouter implements MountedGame {
  private readonly repository: Repository
  private readonly variants: VariantRepository
  private readonly survey: SurveyRepository
  private readonly sonar: SonarRepository
  private language: Language
  private readonly host: HTMLElement
  private readonly listeners = new AbortController()
  private active: MountedGame
  private route: AppRoute
  private sounds: BrowserSoundEffects | null = null

  /** A bare URL starts at home; explicit game links retain their independent save slots. */
  constructor(
    root: HTMLElement,
    repository: Repository,
    variants: VariantRepository,
    sonar: SonarRepository,
    survey: SurveyRepository,
    language: Language,
  ) {
    this.repository = repository
    this.variants = variants
    this.survey = survey
    this.sonar = sonar
    this.language = language
    root.innerHTML = '<div class="ruleset-host"></div>'
    const host = root.querySelector<HTMLElement>('.ruleset-host')
    if (!host) throw new Error('Route host is missing')
    this.host = host
    this.route = parseRoute(location.search)
    this.active = this.mount()
    root.addEventListener('click', this.select, { signal: this.listeners.signal })
    window.addEventListener('popstate', this.restore, { signal: this.listeners.signal })
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
    this.host.dataset['page'] = this.route.page
    if (this.route.page === 'story')
      return new StoryApp(
        this.host,
        this.variants,
        this.repository,
        this.language,
        sounds,
        this.languageChanged,
      )
    if (this.route.page !== 'game') {
      return new HomeApp(
        this.host,
        this.route.page,
        this.language,
        this.repository,
        sounds,
        this.languageChanged,
      )
    }

    const mode = this.route.mode
    if (mode === 'classic') {
      const difficulty = difficultyOf(
        new URLSearchParams(location.search).get('mode') ??
          this.repository.preferences().difficulty,
      )

      // Remember direct-link choices so returning through the directory restores this save slot.
      this.repository.setPreference({ key: 'difficulty', value: difficulty })

      return new MinesweeperApp(
        this.host,
        new GameSession(this.repository, browserRuntime, difficulty),
        this.repository,
        this.language,
        sounds,
        this.languageChanged,
      )
    }

    if (mode === 'survey')
      return new SurveyApp(
        this.host,
        new SurveySession(this.survey, browserRuntime),
        this.survey,
        this.repository,
        this.language,
        sounds,
        this.languageChanged,
      )

    if (mode === 'sonar')
      return new SonarApp(
        this.host,
        new SonarSession(this.sonar, browserRuntime),
        this.sonar,
        this.repository,
        this.language,
        sounds,
        this.languageChanged,
      )

    const session =
      mode === 'expedition'
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

  /** Intercept ordinary internal link activation while retaining open-in-new-tab gestures. */
  private readonly select = (event: MouseEvent): void => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    )
      return
    const link =
      event.target instanceof Element
        ? event.target.closest<HTMLAnchorElement>('a[data-route]')
        : null
    if (!link || link.target || link.hasAttribute('download')) return

    const url = new URL(link.href)
    if (url.origin !== location.origin || url.pathname !== location.pathname) return
    event.preventDefault()
    const route = parseRoute(url.search)
    if (sameRoute(this.route, route)) return

    // Persist while the old URL still describes the outgoing game's difficulty and language.
    this.active.dispose()
    history.pushState(null, '', url)
    this.show(route)
    this.sounds?.play('tap')
  }

  /** Mount after disposal, reset the shared scroll host and provide a stable keyboard landing. */
  private show(route: AppRoute): void {
    this.route = route
    this.active = this.mount()
    this.host.scrollTo(0, 0)
    const heading = this.host.querySelector<HTMLElement>('[data-route-heading], main h1, main h2')
    if (heading) {
      heading.tabIndex = -1
      heading.focus({ preventScroll: true })
    }
  }

  /** Browser Back and Forward use the same teardown as on-page navigation. */
  private readonly restore = (): void => {
    this.active.dispose()
    const language = parseLanguage(new URLSearchParams(location.search).get('lang'))
    if (language) this.language = language
    this.show(parseRoute(location.search))
  }

  /** The active screen owns translation and preferences; future mounts reuse its language. */
  private readonly languageChanged = (language: Language): void => {
    this.language = language
  }
}
