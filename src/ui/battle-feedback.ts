import { removeTransientEffect } from './transient-effect.js'
import { battleThreat } from '../game/combat-build.js'
import type { EncounterKind } from '../types/tactical.js'
import type { Expedition } from '../types/variants.js'

/** Board-local effects never change hit tests or reveal concealed encounter state. */
function cellAt(root: HTMLElement, index: number): HTMLElement | null {
  return root.querySelector<HTMLElement>(`[data-side="a"] [data-cell="${index}"]`)
}

/** Remove transient layers on completion; repaint/teardown also removes their owning cells. */
function effect(cell: HTMLElement | null, kind: string, text = '', delay = 0): void {
  if (!cell) return

  const layer = document.createElement('span')

  layer.className = `combat-fx ${kind}`
  layer.setAttribute('aria-hidden', 'true')
  layer.textContent = text
  layer.style.animationDelay = `${delay}ms`
  cell.append(layer)
  removeTransientEffect(layer)
}

/** Each enemy has a distinct wind-up silhouette as well as its own ground impact. */
function windup(cell: HTMLElement | null, kind: EncounterKind, reduced: boolean): void {
  const actor =
    cell?.querySelector<HTMLElement>(':scope > img, .landmark-sprite, .dungeon-sprite') ?? cell
  if (!actor) return

  const poses = {
    tide: ['scale(1)', 'translateY(-12%) scale(1.1)', 'translateY(12%)', 'none'],
    bastion: [
      'translateY(0)',
      'translateY(-18%) scaleY(1.12)',
      'translateY(9%) scaleY(.85)',
      'none',
    ],
    brood: ['rotate(0)', 'rotate(-12deg) scale(1.08)', 'rotate(12deg)', 'none'],
    mirror: ['scaleX(1)', 'scaleX(.15) translateY(-10%)', 'scaleX(1.15)', 'none'],
    magnetic: ['translateX(0)', 'translateX(-12%) rotate(-8deg)', 'translateX(15%)', 'none'],
    clock: ['rotate(0)', 'rotate(-35deg) scale(.9)', 'rotate(35deg) scale(1.12)', 'none'],
    echo: ['scale(1)', 'scale(.8)', 'scale(1.22)', 'none'],
    matrix: ['rotate(0)', 'rotate(45deg) scale(.8)', 'rotate(90deg) scale(1.1)', 'rotate(0)'],
  }
  const frames = reduced
    ? [{ opacity: 1 }, { opacity: 0.65 }, { opacity: 1 }]
    : poses[kind].map((transform) => ({ transform }))

  actor.animate(frames, { duration: reduced ? 180 : 520, easing: 'ease-in-out' })
}

/** Play only accepted changes, never an initial load, hover, pause or rejected action. */
export function animateBattleFeedback(
  root: HTMLElement,
  before: Expedition | null,
  after: Expedition | null,
): void {
  if (
    !before?.encounter ||
    !after?.encounter ||
    before.phase !== 'boss' ||
    before.departure.seed !== after.departure.seed ||
    before.floor !== after.floor ||
    before.encounter.kind !== after.encounter.kind
  )
    return

  const enemy = before.encounter
  const next = after.encounter
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const turn = next.turn > enemy.turn || (after.phase === 'lost' && next.event === 'hit')
  // MagneticBoard has already played movement and impacts before this repaint.
  if (turn && enemy.kind === 'magnetic') return

  const bossDamage = Math.max(0, enemy.health - next.health)
  const playerDamage = Math.max(0, before.health - after.health)
  const revived = after.runTriggers.some(
    (relic) =>
      (relic === 'second-wind' || relic === 'abyss-hourglass') &&
      !before.runTriggers.includes(relic),
  )
  // TideBoard already resolved the old footprint before moving tiles. The pawn stays fixed,
  // so the actual injury or absorbed-hit feedback below still belongs to its current cell.
  if (turn && enemy.kind !== 'tide') {
    const targets = before.game.cells.flatMap((_, index) =>
      battleThreat(enemy, index, before.game.config) > 0 ? [index] : [],
    )
    if (targets.length) {
      // Echo bodies move together: the animation must not identify the hidden real body.
      const sources =
        enemy.kind === 'echo'
          ? enemy.bodies
          : enemy.kind === 'brood'
            ? [
                ...(enemy.queenTargets.length ? [enemy.boss] : []),
                ...enemy.orders
                  .filter(
                    (order) => enemy.hatchlings.includes(order.from) && order.targets.length > 0,
                  )
                  .map((order) =>
                    next.kind === 'brood' && next.turn > enemy.turn && order.to !== after.player
                      ? order.to
                      : order.from,
                  ),
              ]
            : [enemy.boss]
      for (const index of sources) windup(cellAt(root, index), enemy.kind, reduced)

      for (const index of targets)
        effect(cellAt(root, index), `combat-impact combat-${enemy.kind}`, '', reduced ? 0 : 240)
    }
  }

  if (bossDamage > 0) {
    const boss = cellAt(root, next.boss)
    if (!turn && (next.event === 'struck' || next.event === 'defeated')) {
      const player = cellAt(root, after.player)
      if (player && boss && !reduced) {
        const from = player.getBoundingClientRect(),
          to = boss.getBoundingClientRect()
        const dx = to.x - from.x,
          dy = to.y - from.y
        const length = Math.max(1, Math.hypot(dx, dy))
        const actor = root.querySelector<HTMLElement>('.dungeon-player') ?? player

        actor.animate(
          [
            { translate: '0 0' },
            { translate: `${(dx / length) * 14}px ${(dy / length) * 14}px`, offset: 0.4 },
            { translate: '0 0' },
          ],
          { duration: 300 },
        )
      }

      effect(boss, 'combat-slash', '', reduced ? 0 : 100)
    }

    effect(boss, `combat-boss-hit combat-${enemy.kind}`, '', reduced ? 0 : 180)
    if (!(turn && next.kind === 'clock' && next.resolution?.echoDamage))
      effect(boss, 'combat-damage', `−${bossDamage}`, reduced ? 0 : 200)
  }

  if (playerDamage > 0 || revived) {
    const player = cellAt(root, after.player)

    effect(player, 'combat-player-hit', '', turn && !reduced ? 260 : 0)
    if (!revived)
      effect(
        player,
        'combat-damage combat-player-damage',
        `−${playerDamage}`,
        turn && !reduced ? 280 : 0,
      )

    const actor = root.querySelector<HTMLElement>('.dungeon-player')
    if (actor && !reduced)
      actor.animate(
        [
          { translate: '0 0' },
          { translate: '-5px 0' },
          { translate: '5px 0' },
          { translate: '-3px 0' },
          { translate: '0 0' },
        ],
        { duration: 330, delay: turn ? 260 : 0 },
      )
  } else if (turn && battleThreat(enemy, before.player, before.game.config) > 0) {
    effect(cellAt(root, after.player), 'combat-guard', '', reduced ? 0 : 260)
  }
}
