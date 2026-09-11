import test from 'node:test'
import assert from 'node:assert/strict'
import { actExpedition, createExpedition } from '../src/game/expedition.js'
import { railMotion, railObjectiveComplete } from '../src/game/floor-rail.js'
import { railLayout } from '../src/game/rail-layout.js'
import { campaignProgress, CAMPAIGN_STAGES } from '../src/game/campaign-catalog.js'
import { pendingRailScene, RAIL_SCENES } from '../src/game/rail-story.js'
import { ExpeditionSession } from '../src/application/expedition-session.js'
import { StorySession } from '../src/application/story-session.js'
import { VariantRepository } from '../src/persistence/variant-repository.js'
import type { Expedition } from '../src/types/variants.js'
import { CURRENT_DEPARTURE, FakeRuntime, MemoryStorage } from './helpers.js'
import { readyRescue, solveRescue } from './rail-helpers.js'

test('the independent rescue has three distinct minefields and a no-guess, unequipped solution', () => {
  const actions = solveRescue()
  assert.ok(actions.filter((action) => action.type === 'reveal').length >= 150)
  assert.equal(actions.filter((action) => action.type === 'interact').length, 21)
  const maps = [1, 2, 3].map(railLayout)
  assert.equal(
    new Set(maps.map((layout) => layout.game.cells.map((cell) => +cell.mine).join(''))).size,
    3,
  )
  for (const layout of maps) {
    const { width, height } = layout.game.config
    assert.ok(width >= 15 && height >= 15)
    const rails = new Set(layout.rail.tracks.map((track) => track.index))
    assert.ok(
      [...rails].some((index) => layout.game.cells[index]?.mine),
      'Tracks do not certify safe cells',
    )
    for (const track of layout.rail.tracks)
      for (const next of track.neighbors) {
        assert.equal(
          Math.abs((next % width) - (track.index % width)) +
            Math.abs(Math.floor(next / width) - Math.floor(track.index / width)),
          1,
        )
        assert.ok(
          layout.rail.tracks.find((entry) => entry.index === next)?.neighbors.includes(track.index),
        )
      }
    const walls = layout.walls.filter(
      (index) => !layout.rail.doors.some((door) => door.index === index),
    )
    const reachable = new Set([layout.entrance]),
      queue = [layout.entrance]
    for (const index of queue)
      for (const next of [index - width, index + width, index - 1, index + 1])
        if (
          next >= 0 &&
          next < width * height &&
          Math.abs((next % width) - (index % width)) <= 1 &&
          !walls.includes(next) &&
          !layout.game.cells[next]!.mine &&
          !reachable.has(next)
        ) {
          reachable.add(next)
          queue.push(next)
        }
    assert.ok(
      layout.game.cells.every(
        (cell, index) => cell.mine || walls.includes(index) || reachable.has(index),
      ),
    )
  }
})

test('cart previews, rejected trips and flags never reveal covered mine truth', () => {
  const run = createExpedition({ ...CURRENT_DEPARTURE, campaign: 'quarry-rescue-v1' })
  const alternate = {
    ...run,
    game: {
      ...run.game,
      cells: run.game.cells.map((cell) =>
        cell.visibility === 'hidden' ? { ...cell, mine: !cell.mine, adjacent: 8 } : cell,
      ),
    },
  }
  assert.deepEqual(railMotion(run), railMotion(alternate))
  assert.deepEqual(railMotion(run, true), railMotion(alternate, true))
  for (const index of [run.rail!.drive, run.rail!.reverse]) {
    const before = actExpedition(run, { type: 'interact', index })
    const after = actExpedition(alternate, { type: 'interact', index })
    assert.deepEqual(before.rail, after.rail)
  }
})

test('every reachable fully explored cart state can recover to a completed route without resetting', () => {
  for (let floor = 1; floor <= 3; floor++) {
    const layout = railLayout(floor)
    const start: Expedition = {
      ...createExpedition({ ...CURRENT_DEPARTURE, campaign: 'quarry-rescue-v1' }),
      ...layout,
      floor,
      player: layout.entrance,
      game: {
        ...layout.game,
        cells: layout.game.cells.map((cell) => ({
          ...cell,
          visibility: cell.mine ? 'flagged' : 'revealed',
        })),
      },
    }
    const key = (run: Expedition): string =>
      JSON.stringify([
        run.rail!.cart,
        run.rail!.previous,
        run.rail!.turnouts.map((turnout) => turnout.selected),
        run.rail!.stations.map((station) => station.visited),
      ])
    const queue = [start],
      states = new Set([key(start)]),
      parents = new Map<string, Set<string>>(),
      goals: string[] = []
    for (const run of queue) {
      if (railObjectiveComplete(run.rail!)) goals.push(key(run))
      for (const index of [
        run.rail!.drive,
        run.rail!.reverse,
        ...run.rail!.turnouts.map((turnout) => turnout.index),
      ]) {
        const next = actExpedition(run, { type: 'interact', index })
        if (next === run) continue
        const source = key(run),
          target = key(next)
        const entries = parents.get(target) ?? new Set<string>()
        entries.add(source)
        parents.set(target, entries)
        if (!states.has(target)) {
          states.add(target)
          queue.push(next)
        }
      }
      assert.ok(queue.length < 2000, 'Finite routing graph')
    }
    const recoverable = new Set(goals)
    for (const target of goals)
      for (const source of parents.get(target) ?? [])
        if (!recoverable.has(source)) {
          recoverable.add(source)
          goals.push(source)
        }
    assert.equal(
      recoverable.size,
      states.size,
      `Floor ${floor}: every reachable routing state reaches the objective`,
    )
  }
})

test('rescue journals reload every command, pay once and leave main progress and the roguelite untouched', () => {
  const repo = new VariantRepository(new MemoryStorage()),
    camp = readyRescue(repo, false)
  let session = new ExpeditionSession(repo.forCampaign('quarry-rescue'), new FakeRuntime())
  assert.equal(session.start('explorer', []), false, 'The URL cannot bypass the physical entrance')
  const story = new StorySession(camp)
  assert.ok(story.dispatch({ type: 'visit', index: 25 }))
  const before = repo.expedition()!
  assert.ok(session.start('explorer', []))
  for (const action of solveRescue()) {
    assert.ok(session.dispatch(action), JSON.stringify(action))
    const run = session.run
    if (run?.phase === 'won') break
    session = new ExpeditionSession(repo.forCampaign('quarry-rescue'), new FakeRuntime())
    assert.deepEqual(session.run, run)
  }
  assert.equal(session.run?.phase, 'won')
  const after = repo.expedition()!
  assert.deepEqual(after.journal, before.journal)
  assert.deepEqual(after.records, before.records)
  assert.equal(after.camp.supplies, before.camp.supplies + 120)
  assert.deepEqual(after.camp.storyProfessions, ['rescuer'])
  assert.deepEqual(after.camp.upgrades, before.camp.upgrades)
  assert.ok(after.story?.completed.includes('rescue-toma'))
  assert.ok(after.story?.facts?.includes('toma-rescued'))
  for (const stage of CAMPAIGN_STAGES.filter((stage) => stage.id !== 'quarry-rescue'))
    assert.deepEqual(
      campaignProgress(after.campaign, stage.id),
      campaignProgress(before.campaign, stage.id),
    )
  assert.equal(pendingRailScene(null, camp.stageProgress('quarry-rescue')), 'rail-home')
  for (const scene of RAIL_SCENES) camp.completeStageScene('quarry-rescue', scene)
  assert.equal(pendingRailScene(null, camp.stageProgress('quarry-rescue')), null)
  assert.equal(
    new ExpeditionSession(repo.forCampaign('quarry-rescue'), new FakeRuntime()).start(
      'explorer',
      [],
    ),
    false,
  )
  assert.equal(repo.expedition()!.camp.supplies, after.camp.supplies)
})
