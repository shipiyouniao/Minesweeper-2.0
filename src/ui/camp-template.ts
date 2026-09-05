import { EQUIPMENT, allowedDeparture, equipmentCost } from '../game/expedition.js'
import { upgradeCost } from '../game/camp-progression.js'
import { PROFESSIONS } from '../game/professions.js'
import { variantTier } from '../game/variant-difficulty.js'
import { difficultyRewardPercent } from '../game/expedition-rewards.js'
import type { Camp, Equipment, Profession, Upgrade } from '../types/variants.js'
import type { CampPage, CampScreen, ShopCategory } from '../types/camp-navigation.js'
import type { DungeonSprite } from '../types/dungeon-ui.js'
import type { Language } from '../types/localization.js'
import type { VariantDifficulty } from '../types/variant-difficulty.js'
import { campLabel, campPageName, shopCategoryName } from './camp-copy.js'
import { shopCategory, shopItems, shopSprite } from './camp-navigation.js'
import { battleHealthCopy, combatSprite } from './combat-build-copy.js'
import { spriteImage } from './dungeon-sprites.js'
import { professionSprite } from './profession-presentation.js'
import { professionPreviewTemplate } from './profession-skill-template.js'
import {
  difficultyCopy,
  equipmentCopy,
  professionCopy,
  upgradeCopy,
  variantCopy,
} from './variant-copy.js'
import { choice, difficultyTemplate } from './variant-templates.js'
import { escapeHtml } from './presentation.js'

const DESTINATIONS: readonly CampPage[] = ['professions', 'equipment', 'route', 'shop']
const CATEGORIES: readonly ShopCategory[] = ['all', 'professions', 'equipment', 'relics', 'camp']

/** Give the four navigation entries recognizable existing artwork. */
function destinationSprite(page: CampPage): DungeonSprite {
  switch (page) {
    case 'professions':
      return 'player'
    case 'equipment':
      return 'workshop'
    case 'route':
      return 'exit'
    default:
      return 'treasure'
  }
}

/** Describe each destination in one short line. */
function destinationNote(language: Language, page: CampPage): string {
  switch (page) {
    case 'professions':
      return campLabel(language, 'professionHelp')
    case 'equipment':
      return campLabel(language, 'equipmentHelp')
    case 'route':
      return campLabel(language, 'routeHelp')
    default:
      return campLabel(language, 'shopHelp')
  }
}

/** Summarize the actual selected loadout without rendering every possible choice. */
function loadoutSummary(language: Language, equipment: readonly Equipment[]): string {
  if (!equipment.length) return `<p class="variant-note">${campLabel(language, 'empty')}</p>`

  return `<ul class="camp-loadout-summary">${equipment.map((item) => `<li>${spriteImage(combatSprite(item))}<span>${equipmentCopy(language, item).name}</span></li>`).join('')}</ul>`
}

/** Keep the landing screen about the next departure, with editing behind four destinations. */
function overviewTemplate(
  language: Language,
  camp: Camp,
  profession: Profession,
  equipment: readonly Equipment[],
  difficulty: VariantDifficulty,
): string {
  const t = variantCopy(language)
  const career = professionCopy(language, profession)
  const tier = variantTier(difficulty)
  const spent = equipment.reduce((total, item) => total + equipmentCost(item), 0)

  return `<div class="camp-overview">
    <section class="camp-departure" aria-label="${campLabel(language, 'current')}">
      <p class="eyebrow">${campLabel(language, 'current')}</p>
      <div class="camp-current-profession">${spriteImage(professionSprite(profession))}<div><span>${t.profession}</span><h2>${career.name}</h2><p>${career.note}</p></div></div>
      <div class="camp-summary-heading"><h3>${campPageName(language, 'equipment')}</h3><span>${spent} / 3</span></div>
      ${loadoutSummary(language, equipment)}
      <div class="camp-route-summary"><div><span>${t.difficulty}</span><strong>${difficultyCopy(language, difficulty)}</strong></div><p>${tier.size} × ${tier.size} · ${campLabel(language, 'floors').replace('{count}', String(tier.floors))}<br>${t.rewardRate} ×${difficultyRewardPercent(difficulty) / 100}</p></div>
      <button class="primary-button" data-control="start">${t.start} ↗</button>
    </section>
    <nav class="camp-destinations" aria-label="${t.camp}">${DESTINATIONS.map((page) => `<button class="camp-destination" data-control="camp-page:${page}">${spriteImage(destinationSprite(page))}<span><strong>${campPageName(language, page)}</strong><small>${destinationNote(language, page)}</small></span><span aria-hidden="true">↗</span></button>`).join('')}</nav>
  </div><p class="camp-history-summary">${t.departures} ${camp.completed} · ${campLabel(language, 'ownedCount').replace('{count}', String(camp.upgrades.length))}</p>`
}

/** Present profession selection and its active skill on a dedicated screen. */
function professionsTemplate(language: Language, camp: Camp, profession: Profession): string {
  return `<p class="variant-intro">${campLabel(language, 'professionHelp')}</p><div class="choice-grid camp-professions">${PROFESSIONS.map((career) => choice(`profession:${career}`, professionCopy(language, career), career === profession, career !== 'explorer' && !camp.upgrades.includes(career), professionSprite(career))).join('')}</div>${professionPreviewTemplate(language, profession)}`
}

/** Keep the same bounded loadout rules while moving their controls out of the overview. */
function equipmentTemplate(
  language: Language,
  camp: Camp,
  profession: Profession,
  equipment: readonly Equipment[],
): string {
  if (!camp.upgrades.includes('workshop'))
    return `<div class="camp-locked">${spriteImage('workshop')}<h2>${upgradeCopy(language, 'workshop').name}</h2><p>${upgradeCopy(language, 'workshop').note}</p><button class="primary-button" data-control="shop-item:workshop">${campPageName(language, 'shop')} ↗</button></div>`

  const spent = equipment.reduce((total, item) => total + equipmentCost(item), 0)
  return `<p class="camp-budget">${campLabel(language, 'loadoutBudget')} <strong>${spent} / 3</strong></p><div class="choice-grid">${EQUIPMENT.map((item) => choice(`equipment:${item}`, equipmentCopy(language, item), equipment.includes(item), !equipment.includes(item) && !allowedDeparture(camp, profession, [...equipment, item]), combatSprite(item))).join('')}</div>`
}

/** Show effects and purchase feedback together; inspecting a tile never spends supplies. */
function shopDetail(
  language: Language,
  camp: Camp,
  item: Upgrade,
  index: number,
  count: number,
): string {
  const t = variantCopy(language)
  const description = upgradeCopy(language, item)
  const owned = camp.upgrades.includes(item)
  const price = upgradeCost(item)
  const number = new Intl.NumberFormat(language)
  const remaining = Math.max(0, price - camp.supplies)
  const profession = PROFESSIONS.find((career) => career === item)

  return `<aside class="shop-detail" id="shop-detail" aria-labelledby="shop-detail-title" style="--shop-rows:${Math.ceil(count / 6)};--compact-rows:${Math.ceil(count / 4)};--detail-row:${Math.floor(index / 3) + 2}">
    <p class="eyebrow">${shopCategoryName(language, shopCategory(item))}</p>${spriteImage(shopSprite(item))}
    <h2 id="shop-detail-title">${description.name}</h2><p class="shop-effect">${description.note}</p>
    ${profession ? professionPreviewTemplate(language, profession) : ''}
    ${shopCategory(item) === 'equipment' && !camp.upgrades.includes('workshop') ? `<p class="variant-note">${campLabel(language, 'workshopRequired')}</p>` : ''}
    <div class="shop-purchase"><p><strong>${number.format(price)}</strong> ${t.supplies}</p><button class="primary-button" data-control="upgrade:${item}" data-focus-fallback="shop-item:${item}" ${owned || remaining > 0 ? 'disabled' : ''}>${owned ? t.owned : campLabel(language, 'buy')}</button></div>
    <p class="shop-purchase-status" role="status">${owned ? t.owned : remaining ? campLabel(language, 'missing').replace('{count}', number.format(remaining)) : ''}</p>
  </aside>`
}

/** Use an explicit grid position so the mobile detail expands below its selected row. */
function shopTemplate(language: Language, camp: Camp, screen: CampScreen): string {
  const t = variantCopy(language)
  const items = shopItems(screen.category)
  const selected = items.includes(screen.selected) ? screen.selected : (items[0] ?? 'surveyor')
  const selectedIndex = items.indexOf(selected)
  const selectedRow = Math.floor(selectedIndex / 3)
  const number = new Intl.NumberFormat(language)

  return `<p class="variant-intro">${campLabel(language, 'purchaseHelp')}</p>
    <div class="shop-filters" role="group" aria-label="${campPageName(language, 'shop')}">${CATEGORIES.map((category) => `<button data-control="shop-category:${category}" aria-pressed="${screen.category === category}">${shopCategoryName(language, category)}</button>`).join('')}</div>
    <div class="shop-grid">${items
      .map((item, index) => {
        const description = upgradeCopy(language, item)
        const owned = camp.upgrades.includes(item)
        const price = number.format(upgradeCost(item))
        const row = Math.floor(index / 3)
        const label = `${description.name}, ${price} ${t.supplies}${owned ? `, ${t.owned}` : ''}`

        return `<button class="shop-tile" data-control="shop-item:${item}" aria-pressed="${item === selected}" aria-controls="shop-detail" aria-label="${escapeHtml(label)}" style="--tile-column:${(index % 6) + 1};--tile-row:${Math.floor(index / 6) + 1};--compact-column:${(index % 4) + 1};--compact-row:${Math.floor(index / 4) + 1};--mobile-column:${(index % 3) + 1};--mobile-row:${row + 1 + Number(row > selectedRow)}">
        ${owned ? '<span class="shop-owned" aria-hidden="true">✓</span>' : ''}${spriteImage(shopSprite(item))}<strong>${description.name}</strong><span class="shop-price">${price}</span></button>${item === selected ? shopDetail(language, camp, item, index, items.length) : ''}`
      })
      .join('')}</div>`
}

/** Render one camp screen while preserving the current profession, loadout and route. */
export function campTemplate(
  language: Language,
  camp: Camp,
  profession: Profession,
  equipment: readonly Equipment[],
  difficulty: VariantDifficulty,
  screen: CampScreen,
): string {
  const t = variantCopy(language)
  const number = new Intl.NumberFormat(language)
  let content: string
  switch (screen.page) {
    case 'overview':
      content = overviewTemplate(language, camp, profession, equipment, difficulty)
      break
    case 'professions':
      content = professionsTemplate(language, camp, profession)
      break
    case 'equipment':
      content = equipmentTemplate(language, camp, profession, equipment)
      break
    case 'route':
      content = `<p class="variant-intro">${campLabel(language, 'routeHelp')}</p>${difficultyTemplate(language, difficulty, true)}<p class="variant-note reward-rate">${t.rewardRate} ×${difficultyRewardPercent(difficulty) / 100}</p><p class="variant-intro">${t.campHelp}</p><p class="variant-intro">${battleHealthCopy(language)}</p>`
      break
    case 'shop':
      content = shopTemplate(language, camp, screen)
      break
  }

  return `<section class="camp-panel" data-camp-page="${screen.page}">
    <header class="camp-header"><div>${screen.page === 'overview' ? '<p class="eyebrow">EXPEDITION / BASE CAMP</p>' : `<button class="text-button camp-back" data-control="camp-page:overview">← ${campLabel(language, 'back')}</button>`}<h1 tabindex="-1">${campPageName(language, screen.page)}</h1></div><div class="camp-wallet">${spriteImage('treasure')}<div><span>${t.supplies}</span><strong>${number.format(camp.supplies)}</strong></div></div></header>
    ${screen.page === 'overview' ? '' : `<nav class="camp-subnav" aria-label="${t.camp}">${DESTINATIONS.map((page) => `<button data-control="camp-page:${page}" ${screen.page === page ? 'aria-current="page"' : ''}>${campPageName(language, page)}</button>`).join('')}</nav>`}
    ${content}
  </section>`
}
