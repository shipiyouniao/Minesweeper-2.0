import { CampSession } from '../src/application/camp-session.js'
import { campaignProgress, updateCampaign } from '../src/game/campaign-catalog.js'
import { createStoryRun } from '../src/game/story.js'
import { checkpointStory } from '../src/game/story-checkpoint.js'
import { recordStoryFacts } from '../src/game/story-quests.js'
import { VariantRepository } from '../src/persistence/variant-repository.js'
import { readyFinale } from './finale-fixtures.js'
import assert from 'node:assert/strict'
import { frontierCells, actExpedition } from '../src/game/expedition.js'
import { ExpeditionSession } from '../src/application/expedition-session.js'
import type { Expedition, ExpeditionAction } from '../src/types/variants.js'
import type { PowerFeed } from '../src/types/floor-power.js'

/** Configure public ancestor feeds before recording each terminal; support arbitrary generated trees. */
export function recollectionPowerSolution(run: Expedition): readonly ExpeditionAction[] {
  let current = run
  const actions: ExpeditionAction[] = []
  /** Every planned click must work through the same movement and readiness rules as the player. */
  const operate = (index: number): void => {
    const action = { type: 'interact', index } as const
    const next = actExpedition(current, action)
    assert.notEqual(next, current)
    current = next
    actions.push(action)
  }
  for (const receiver of run.power!.receivers) {
    if (receiver.recorded) continue
    const path: PowerFeed[] = []
    const seen = new Set<number>()
    let feed: PowerFeed | null = receiver.input
    while (feed) {
      assert.ok(!seen.has(feed.junction), 'a receiver cannot depend on a power cycle')
      seen.add(feed.junction)
      path.push(feed)
      feed = current.power!.junctions.find((entry) => entry.index === feed!.junction)!.input
    }
    for (const input of path.reverse())
      while (
        current.power!.junctions.find((entry) => entry.index === input.junction)!.selected !==
        input.branch
      )
        operate(input.junction)
    operate(receiver.index)
  }
  return actions
}

/** Build browser fixtures through accepted physical actions; the truth oracle stays in tests. */
export function finishRecollectionFloor(session: ExpeditionSession): void {
  for (let step = 0; step < 1000 && session.run?.phase === 'exploring'; step++) {
    const run = session.run
    const safe = [...frontierCells(run)].find((index) => !run.game.cells[index]!.mine)
    if (safe === undefined) break
    assert.ok(session.dispatch({ type: 'reveal', index: safe }))
  }
  if (session.run?.phase !== 'exploring') return
  for (const [index, cell] of session.run.game.cells.entries())
    if (cell.mine && cell.visibility === 'hidden' && !session.run.walls.includes(index))
      assert.ok(session.dispatch({ type: 'flag', index }))
  const run = session.run
  for (const relay of run.circuits?.relays ?? [])
    if (relay.active) assert.ok(session.dispatch({ type: 'interact', index: relay.index }))
  if (run.power)
    for (const action of recollectionPowerSolution(run)) assert.ok(session.dispatch(action))
  assert.ok(session.dispatch({ type: 'move', index: run.exit }))
}

/** A completed first chapter keeps the old roguelite journal intact at the newly opened gate. */
export function readyChapterTwo(repository: VariantRepository): CampSession {
  const camp = readyFinale(repository)
  const saved = repository.expedition()!
  let campaign = saved.campaign
  for (const id of ['tower-control', 'northwest-bastion'] as const)
    campaign = updateCampaign(campaign, {
      ...campaignProgress(campaign, id),
      cleared: true,
      scenes: id === 'tower-control' ? ['control-restored'] : ['pass-open', 'chapter-camp'],
    })
  repository.saveExpedition({ ...saved, campaign: campaign! })
  camp.saveStory(
    recordStoryFacts(
      {
        ...camp.story,
        campId: 'camp',
        world: checkpointStory({ ...createStoryRun(9), player: 16 }),
      },
      ['west-line-restored', 'west-shortcut', 'chapter-one-cleared'],
    ),
  )
  camp.acceptDiscoveredRoutes()
  return camp
}
