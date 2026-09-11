import type { Language } from '../types/localization.js'
import { parseCampaignStage } from '../game/campaign-catalog.js'
import type { AppRoute, FreeMode } from '../types/navigation.js'

export const FREE_MODES: readonly FreeMode[] = ['classic', 'twin', 'sonar', 'survey']

/** Decode only public route names; a bare or invalid link opens the homepage. */
export function parseRoute(search: string): AppRoute {
  const params = new URLSearchParams(search)
  if (params.get('page') === 'campaign') {
    const stage = parseCampaignStage(params.get('stage'))
    return stage ? { page: 'campaign', stage } : { page: 'campaign' }
  }

  if (params.get('page') === 'recollection') return { page: 'recollection' }

  if (params.get('page') === 'story') return { page: 'story' }

  if (params.get('page') === 'free') return { page: 'free' }

  const mode = params.get('ruleset')
  if (
    mode === 'classic' ||
    mode === 'expedition' ||
    mode === 'twin' ||
    mode === 'sonar' ||
    mode === 'survey'
  ) {
    return { page: 'game', mode }
  }

  // Classic difficulty links predate the ruleset parameter and remain directly playable.

  if (mode === null && params.has('mode')) return { page: 'game', mode: 'classic' }

  return { page: 'home' }
}

/** Query-only links work unchanged at the domain root and the GitHub Pages subpath. */
export function routeHref(route: AppRoute, language: Language): string {
  const params = new URLSearchParams()
  if (route.page === 'game') params.set('ruleset', route.mode)
  else if (route.page === 'recollection') params.set('page', 'recollection')
  else if (route.page === 'free') params.set('page', 'free')
  else if (route.page === 'campaign') {
    params.set('page', 'campaign')
    if (route.stage) params.set('stage', route.stage)
  } else if (route.page === 'story') params.set('page', 'story')

  params.set('lang', language)

  return `?${params}`
}

/** Compare route identity without coupling navigation to difficulty or language preferences. */
export function sameRoute(left: AppRoute, right: AppRoute): boolean {
  return (
    left.page === right.page &&
    (left.page !== 'campaign' ||
      (right.page === 'campaign' &&
        (left.stage ?? 'tower-galleries') === (right.stage ?? 'tower-galleries'))) &&
    (left.page !== 'game' || (right.page === 'game' && left.mode === right.mode))
  )
}
