import assert from 'node:assert/strict'
import test from 'node:test'
import { UPGRADES, upgradeCost } from '../src/game/camp-progression.js'
import { navigateCamp, shopItems } from '../src/ui/camp-navigation.js'
import { parseVariantCommand } from '../src/ui/variant-input.js'
import type { CampScreen, ShopCategory } from '../src/types/camp-navigation.js'

test('shop filters partition the complete catalog and keep increasing prices without mutating it', () => {
  const original = [...UPGRADES]
  const categories: readonly ShopCategory[] = ['professions', 'equipment', 'relics', 'camp']
  const categorized = categories.flatMap(shopItems)
  assert.equal(categorized.length, UPGRADES.length)
  assert.equal(new Set(categorized).size, UPGRADES.length)
  assert.deepEqual(new Set(categorized), new Set(UPGRADES))

  for (const category of ['all', ...categories] as const) {
    const items = shopItems(category)
    assert.ok(items.length)
    for (let index = 1; index < items.length; index++) {
      const previous = items[index - 1]!
      const current = items[index]!
      assert.ok(upgradeCost(previous) <= upgradeCost(current))
      if (upgradeCost(previous) === upgradeCost(current))
        assert.ok(UPGRADES.indexOf(previous) < UPGRADES.indexOf(current))
    }
  }
  assert.deepEqual(UPGRADES, original)
  assert.ok(shopItems('equipment').includes('medical-kit'))
  assert.ok(shopItems('relics').includes('battle-manual'))
  assert.ok(shopItems('camp').includes('weapon-training'))
})

test('camp navigation preserves selection, reconciles filters and follows a locked workshop link', () => {
  const screen: CampScreen = { page: 'shop', category: 'all', selected: 'steel-blade' }
  const away = navigateCamp(screen, { type: 'camp-page', value: 'equipment' })
  assert.deepEqual(navigateCamp(away, { type: 'camp-page', value: 'shop' }), screen)

  const equipment = navigateCamp(screen, { type: 'shop-category', value: 'equipment' })
  assert.equal(equipment.selected, 'steel-blade')
  const careers = navigateCamp(equipment, { type: 'shop-category', value: 'professions' })
  assert.equal(careers.selected, 'surveyor')
  const workshop = navigateCamp(careers, { type: 'shop-item', value: 'workshop' })
  assert.equal(workshop.page, 'shop')
  assert.ok(shopItems(workshop.category).includes(workshop.selected))
  assert.equal(workshop.selected, 'workshop')
  assert.equal(screen.selected, 'steel-blade')
})

test('camp commands reject unknown screens, filters and item IDs at the input boundary', () => {
  for (const command of ['camp-page:shop', 'shop-category:equipment', 'shop-item:workshop'])
    assert.ok(parseVariantCommand(command))
  for (const command of [
    'camp-page',
    'camp-page:settings',
    'shop-category:cheap',
    'shop-item:fake',
    'shop-item:workshop:buy',
  ])
    assert.equal(parseVariantCommand(command), null)
  assert.deepEqual(parseVariantCommand('shop-item:surveyor'), {
    type: 'shop-item',
    value: 'surveyor',
  })
  assert.deepEqual(parseVariantCommand('upgrade:surveyor'), { type: 'upgrade', value: 'surveyor' })
})
