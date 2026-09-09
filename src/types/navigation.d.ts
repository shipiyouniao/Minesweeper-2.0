import type { Ruleset } from './variants.js'

/** Menus are destinations, not game modes, and never create a game session. */
export type MenuPage = 'home' | 'free'

/** A route names either a menu or one independently saved game. */
export type AppRoute =
  { readonly page: MenuPage } | { readonly page: 'game'; readonly mode: Ruleset }

/** Free play deliberately excludes the expedition's persistent progression loop. */
export type FreeMode = 'classic' | 'twin' | 'sonar' | 'survey'
