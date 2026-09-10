import assert from 'node:assert/strict'
import test from 'node:test'
import { ExpeditionSession } from '../src/application/expedition-session.js'
import { CampSession } from '../src/application/camp-session.js'
import { campaignProgress, updateCampaign } from '../src/game/campaign-catalog.js'
import { createStoryRun } from '../src/game/story.js'
import { checkpointStory } from '../src/game/story-checkpoint.js'
import { VariantRepository } from '../src/persistence/variant-repository.js'
import { pendingObservatoryScene } from '../src/game/observatory-story.js'
import { storyEnvelopeStatus } from '../src/persistence/story-encoder.js'
import { parseRoute, routeHref } from '../src/ui/navigation.js'
import { FakeRuntime, MemoryStorage } from './helpers.js'
import { solveObservatory } from './observatory-helpers.js'

/** Begin with a completed rescue and a persistent north-road entry, retaining a live roguelite. */
function ready(repo: VariantRepository, player = 86): CampSession {
  new ExpeditionSession(repo, new FakeRuntime()).start('explorer', [])
  const camp = new CampSession(repo),
    world = createStoryRun(3)
  camp.saveStory({
    ...camp.story,
    completed: ['reach-camp', 'meet-guide', 'survey-road', 'repair-lift', 'reach-tower'],
    facts: [
      'camp-reached',
      'guide-met',
      'lift-discovered',
      'spindle-secured',
      'lift-restored',
      'tower-reached',
    ],
    world: checkpointStory({ ...world, player }),
  })
  const saved = repo.expedition()!
  let campaign = saved.campaign
  for (const id of ['tower-galleries', 'tower-relay'] as const)
    campaign = updateCampaign(campaign, {
      ...campaignProgress(campaign, id),
      cleared: true,
      scenes: id === 'tower-relay' ? ['rescued'] : [],
    })
  assert.ok(campaign)
  repo.saveExpedition({ ...saved, campaign })
  return camp
}

test('third-stage departure requires the rescue, Nia task and the physical north-road turn', () => {
  const repo = new VariantRepository(new MemoryStorage())
  const stage = new ExpeditionSession(repo.forCampaign('ridge-observatory'), new FakeRuntime())
  assert.equal(stage.start('explorer', []), false)
  const camp = ready(repo, 85)
  assert.equal(stage.start('explorer', []), false)
  const balance = camp.camp.supplies
  camp.acceptRidgeRoute()
  camp.acceptRidgeRoute()
  assert.equal(camp.story.accepted?.filter((id) => id === 'survey-ridge').length, 1)
  assert.equal(camp.camp.supplies, balance)
  assert.equal(stage.start('explorer', []), false)
  const world = createStoryRun(3)
  camp.saveStory({ ...camp.story, world: checkpointStory({ ...world, player: 86 }) })
  assert.equal(stage.start('explorer', []), true)
  const route = { page: 'campaign', stage: 'ridge-observatory' } as const
  assert.deepEqual(parseRoute(routeHref(route, 'zh')), route)
})

test('every accepted intent resumes exactly and settlement preserves the roguelite and prior stages', () => {
  const storage = new MemoryStorage(),
    repo = new VariantRepository(storage),
    camp = ready(repo)
  camp.acceptRidgeRoute()
  const before = repo.expedition()!
  let stage = new ExpeditionSession(repo.forCampaign('ridge-observatory'), new FakeRuntime())
  assert.ok(stage.start('explorer', []))
  stage.completeCampaignScene('ridge-entry')
  for (const action of solveObservatory().actions) {
    assert.ok(stage.dispatch(action), JSON.stringify(action))
    const run = stage.run
    if (run?.phase === 'won') break
    stage = new ExpeditionSession(repo.forCampaign('ridge-observatory'), new FakeRuntime())
    assert.deepEqual(stage.run, run)
    assert.ok(stage.stageProgress.scenes.includes('ridge-entry'))
  }
  assert.equal(stage.run?.phase, 'won')
  const after = repo.expedition()!
  assert.deepEqual(after.journal, before.journal)
  assert.deepEqual(after.records, before.records)
  for (const id of ['tower-galleries', 'tower-relay'] as const)
    assert.deepEqual(campaignProgress(after.campaign, id), campaignProgress(before.campaign, id))
  assert.equal(after.camp.supplies, before.camp.supplies + 100)
  assert.ok(after.story?.completed.includes('survey-ridge'))
  assert.ok(after.story?.facts?.includes('ridge-surveyed'))
  assert.equal(pendingObservatoryScene(null, camp.observatory), 'ridge-found')
  camp.completeObservatoryScene('ridge-found')
  assert.equal(pendingObservatoryScene(null, camp.observatory), null)
  const settled = new ExpeditionSession(repo.forCampaign('ridge-observatory'), new FakeRuntime())
  assert.equal(settled.start('explorer', []), false)
  assert.equal(camp.camp.supplies, after.camp.supplies)
})

test('retry keeps completed dialogue while rebuilding floor controls and unknown future revisions stay read-only', () => {
  const storage = new MemoryStorage(),
    repo = new VariantRepository(storage),
    camp = ready(repo)
  camp.acceptRidgeRoute()
  const stage = new ExpeditionSession(repo.forCampaign('ridge-observatory'), new FakeRuntime())
  assert.ok(stage.start('explorer', []))
  stage.completeCampaignScene('ridge-entry')
  for (const action of solveObservatory().actions.slice(0, 8)) assert.ok(stage.dispatch(action))
  assert.ok(stage.dispatch({ type: 'retreat' }))
  const retry = new ExpeditionSession(repo.forCampaign('ridge-observatory'), new FakeRuntime())
  assert.ok(retry.start('explorer', []))
  assert.equal(pendingObservatoryScene(retry.run, retry.stageProgress), null)
  assert.ok(retry.run!.power!.junctions.every((entry) => entry.selected === null))
  const key = 'minesweeper.variants.v1.expedition'
  const future = storage.getItem(key)!.replaceAll('ridge-observatory-v1', 'ridge-observatory-v2')
  assert.equal(storyEnvelopeStatus(future), 'unsupported')
  storage.setItem(key, future)
  const blocked = new VariantRepository(storage)
  new CampSession(blocked).acceptRidgeRoute()
  assert.equal(storage.getItem(key), future)
})
