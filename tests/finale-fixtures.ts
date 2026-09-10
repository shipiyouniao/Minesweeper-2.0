import { ExpeditionSession } from '../src/application/expedition-session.js'
import { CampSession } from '../src/application/camp-session.js'
import { campaignProgress, updateCampaign } from '../src/game/campaign-catalog.js'
import { createStoryRun } from '../src/game/story.js'
import { checkpointStory } from '../src/game/story-checkpoint.js'
import { VariantRepository } from '../src/persistence/variant-repository.js'
import { FakeRuntime } from './helpers.js'

/** Keep a real paused roguelite beside four completed stages and the old tower doorway. */
export function readyFinale(repo: VariantRepository): CampSession {
  new ExpeditionSession(repo, new FakeRuntime()).start('explorer', [])
  const camp = new CampSession(repo)
  const road = createStoryRun(3)
  const tower = createStoryRun(7)
  camp.saveStory({
    ...camp.story,
    arrived: true,
    mapOwned: true,
    completed: [
      'reach-camp',
      'meet-guide',
      'survey-road',
      'repair-lift',
      'reach-tower',
      'survey-ridge',
      'find-beacon',
    ],
    facts: [
      'camp-reached',
      'guide-met',
      'lift-discovered',
      'spindle-secured',
      'lift-restored',
      'tower-reached',
      'ridge-route',
      'ridge-surveyed',
      'beacon-recovered',
    ],
    dialogue: {
      completed: [
        'wake',
        'flag',
        'open',
        'travel',
        'trail',
        'approach',
        'arrival',
        'guide',
        'north-road-start',
        'north-road-found',
        'quarry-lead',
        'spindle-found',
        'lift-repaired',
        'tower-arrival',
      ],
      active: null,
    },
    world: checkpointStory({ ...tower, player: tower.board.exit, visited: [road] }),
  })
  const saved = repo.expedition()!
  let campaign = saved.campaign
  for (const id of ['tower-galleries', 'tower-relay', 'ridge-observatory', 'old-waterway'] as const)
    campaign = updateCampaign(campaign, {
      ...campaignProgress(campaign, id),
      cleared: true,
      scenes:
        id === 'tower-relay'
          ? ['rescued']
          : id === 'ridge-observatory'
            ? ['ridge-found']
            : id === 'old-waterway'
              ? ['waterway-found']
              : [],
    })
  repo.saveExpedition({ ...saved, campaign: campaign! })
  camp.acceptDiscoveredRoutes()
  return camp
}
