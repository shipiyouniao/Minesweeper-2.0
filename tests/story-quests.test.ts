import assert from 'node:assert/strict'
import test from 'node:test'
import { EMPTY_STORY, CampSession } from '../src/application/camp-session.js'
import {
  STORY_TASKS,
  recordStoryFacts,
  storyConditionMet,
  storyTaskIntroduced,
  validateStoryTasks,
} from '../src/game/story-quests.js'
import { VariantRepository } from '../src/persistence/variant-repository.js'
import { MemoryStorage } from './helpers.js'

test('story prerequisites use completed objectives, not reward claims, with explicit all/any rules', () => {
  assert.equal(storyTaskIntroduced('arrival', EMPTY_STORY), null)
  const reached = recordStoryFacts(EMPTY_STORY, ['camp-reached'])
  assert.deepEqual(reached.claimed, [])
  assert.equal(storyTaskIntroduced('arrival', reached), 'meet-guide')
  assert.equal(
    storyConditionMet(
      {
        kind: 'all',
        conditions: [
          { kind: 'task', id: 'reach-camp' },
          {
            kind: 'any',
            conditions: [
              { kind: 'fact', id: 'guide-met' },
              { kind: 'fact', id: 'camp-reached' },
            ],
          },
        ],
      },
      reached,
    ),
    true,
  )
  assert.equal(storyConditionMet({ kind: 'any', conditions: [] }, reached), false)
})

test('a satchel must be secured and delivered; repeated facts cannot repeat a reward', () => {
  const storage = new MemoryStorage()
  let camp = new CampSession(new VariantRepository(storage))
  camp.saveStory(recordStoryFacts(camp.story, ['satchel-secured']))
  assert.deepEqual(camp.story.completed, [])
  camp.saveStory(recordStoryFacts(camp.story, ['camp-reached', 'satchel-delivered']))
  const balance = new VariantRepository(storage).expedition()!.camp.supplies
  camp = new CampSession(new VariantRepository(storage))
  camp.saveStory(
    recordStoryFacts(camp.story, ['camp-reached', 'satchel-secured', 'satchel-delivered']),
  )
  assert.equal(new VariantRepository(storage).expedition()!.camp.supplies, balance)
  assert.equal(balance, 90)
  assert.ok(camp.story.facts?.includes('satchel-delivered'))
})

test('authored tasks reject dependency cycles, missing nodes and duplicate identities', () => {
  assert.deepEqual(validateStoryTasks(STORY_TASKS), [])
  assert.ok(validateStoryTasks([STORY_TASKS[2]!]).some((error) => error.includes('Missing')))
  assert.ok(
    validateStoryTasks([...STORY_TASKS, STORY_TASKS[0]!]).some((error) =>
      error.includes('Duplicate'),
    ),
  )
  assert.ok(
    validateStoryTasks(
      STORY_TASKS.map((task) =>
        task.id === 'reach-camp'
          ? { ...task, prerequisite: { kind: 'task' as const, id: 'meet-guide' as const } }
          : task,
      ),
    ).some((error) => error.includes('Circular')),
  )
})
