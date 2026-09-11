import { ATLAS_PLACES, ATLAS_ROUTES } from '../game/atlas-catalog.js'
import { atlasRouteState } from '../game/atlas-routes.js'
import { storyAtlasIndex, storyAtlasUnlocked } from '../game/story-atlas.js'
import type { AtlasPoint } from '../types/atlas.js'
import type { StoryViewState } from '../types/story.js'

/** Curve through authored bends while meeting each location at its exact map coordinate. */
function routePath(points: readonly AtlasPoint[]): string {
  let path = `M${points[0]!.x * 8} ${points[0]!.y * 4.6}`
  for (let index = 1; index < points.length - 1; index++) {
    const point = points[index]!,
      next = points[index + 1]!
    path += ` Q${point.x * 8} ${point.y * 4.6} ${(point.x + next.x) * 4} ${(point.y + next.y) * 2.3}`
  }

  const end = points.at(-1)!
  return `${path} L${end.x * 8} ${end.y * 4.6}`
}

/** Roads and their location dots stay visible at both detail levels, beneath clickable landmarks. */
export function atlasRouteLayer(state: StoryViewState): string {
  const routes = ATLAS_ROUTES.map((route) => {
    const from = ATLAS_PLACES.find((place) => place.scene === route.from)!
    const to = ATLAS_PLACES.find((place) => place.scene === route.to)!
    const points = [from, ...route.via, to]
    const status = atlasRouteState(route, state.progress, state.run)
    const path = routePath(points)
    // A single arrow follows the final straight section of the one-way haul track.
    const previous = points.at(-2)!
    const arrowPoint = { x: (previous.x + to.x) / 2, y: (previous.y + to.y) / 2 }
    const angle = (Math.atan2((to.y - previous.y) * 4.6, (to.x - previous.x) * 8) * 180) / Math.PI
    const arrow = route.oneWay
      ? `<g transform="translate(${arrowPoint.x * 8} ${arrowPoint.y * 4.6}) rotate(${angle})"><path class="atlas-route-direction" d="m-5-5 7 5-7 5"/></g>`
      : ''

    return `<g class="atlas-route is-${status}" data-atlas-route="${route.from}:${route.to}" data-route-state="${status}" data-one-way="${!!route.oneWay}"><path class="atlas-route-bed" d="${path}"/><path class="atlas-route-line" d="${path}"/>${arrow}</g>`
  }).join('')
  const current = state.board.scene.id
  const dots = ATLAS_PLACES.map((place) => {
    const open = storyAtlasUnlocked(state.progress, state.run, storyAtlasIndex(place.scene))
    return `<circle class="atlas-waypoint ${open ? 'is-known' : ''} ${current === place.scene ? 'is-current' : ''}" data-atlas-waypoint="${place.scene}" cx="${place.x * 8}" cy="${place.y * 4.6}" r="4"/>`
  }).join('')

  return `<svg class="atlas-route-layer" viewBox="0 0 800 460" preserveAspectRatio="none" aria-hidden="true">${routes}${dots}</svg>`
}
