import { sharedStyles } from './shared-styles.js'
import { campStyles } from './camp-styles.js'
import { upgradeCost } from '../game/camp-progression.js'
import {
  EQUIPMENT,
  allowedDeparture,
  equipmentCost,
  equipmentPurchaseLocked,
} from '../game/expedition.js'
import { PROFESSIONS } from '../game/professions.js'
import { message } from '../i18n.js'
import type { CampScreen, ShopCategory } from '../types/camp-navigation.js'
import type { Language } from '../types/localization.js'
import type { Camp, Equipment, Profession, Upgrade } from '../types/variants.js'
import { campLabel, campPageName, shopCategoryName } from './camp-copy.js'
import { shopCategory, shopItems, shopSprite } from './camp-navigation.js'
import { combatSprite } from './combat-build-copy.js'
import { spriteImage } from './dungeon-sprites.js'
import { milestonesTemplate } from './milestone-template.js'
import { escapeHtml } from './presentation.js'
import { professionSprite } from './profession-presentation.js'
import { professionPreviewTemplate } from './profession-skill-template.js'
import { equipmentCopy, professionCopy, upgradeCopy, variantCopy } from './variant-copy.js'
import { choice } from './variant-templates.js'

const CATEGORIES: readonly ShopCategory[] = ['all', 'professions', 'equipment', 'relics', 'camp']

/** Present profession selection and its active skill on a dedicated screen. */
function professionsTemplate(language: Language, camp: Camp, profession: Profession): string {
  return `<p class="variant-intro ${sharedStyles['variant-intro']}">${campLabel(language, 'professionHelp')}</p><div class="choice-grid ${sharedStyles['choice-grid']} camp-professions ${campStyles['camp-professions']}">${PROFESSIONS.map((career) => choice(`profession:${career}`, professionCopy(language, career), career === profession, !allowedDeparture(camp, career, []), professionSprite(career))).join('')}</div>${professionPreviewTemplate(language, profession)}`
}

/** Present bounded loadout choices at the workshop facility. */
function equipmentTemplate(
  language: Language,
  camp: Camp,
  profession: Profession,
  equipment: readonly Equipment[],
): string {
  if (!camp.upgrades.includes('workshop'))
    return `<div class="camp-locked ${campStyles['camp-locked']}">${spriteImage('workshop')}<h2>${upgradeCopy(language, 'workshop').name}</h2><p>${upgradeCopy(language, 'workshop').note}</p></div>`

  const spent = equipment.reduce((total, item) => total + equipmentCost(item), 0)

  return `<p class="camp-budget ${campStyles['camp-budget']}">${campLabel(language, 'loadoutBudget')} <strong>${spent} / 3</strong></p><div class="choice-grid ${sharedStyles['choice-grid']}">${EQUIPMENT.map((item) => choice(`equipment:${item}`, equipmentCopy(language, item), equipment.includes(item), !equipment.includes(item) && !allowedDeparture(camp, profession, [...equipment, item]), combatSprite(item))).join('')}</div>`
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
  const locked = equipmentPurchaseLocked(camp, item)
  const profession = PROFESSIONS.find((career) => career === item)

  return `<aside class="shop-detail ${campStyles['shop-detail']}" id="shop-detail" aria-labelledby="shop-detail-title" style="--shop-rows:${Math.ceil(count / 6)};--compact-rows:${Math.ceil(count / 4)};--detail-row:${Math.floor(index / 3) + 2}">
    <p class="eyebrow ${sharedStyles['eyebrow']}">${shopCategoryName(language, shopCategory(item))}</p>${spriteImage(shopSprite(item))}
    <h2 id="shop-detail-title">${description.name}</h2><p class="shop-effect ${campStyles['shop-effect']}">${description.note}</p>
    ${profession ? professionPreviewTemplate(language, profession) : ''}
    ${locked ? `<p class="variant-note ${sharedStyles['variant-note']}">${campLabel(language, 'workshopRequired')}</p>` : ''}
    <div class="shop-purchase ${campStyles['shop-purchase']}"><p><strong>${number.format(price)}</strong> ${t.supplies}</p><button class="primary-button ${sharedStyles['primary-button']}" data-control="upgrade:${item}" data-focus-fallback="shop-item:${item}" ${owned || locked || remaining > 0 ? 'disabled' : ''}>${owned ? t.owned : campLabel(language, 'buy')}</button></div>
    <p class="shop-purchase-status ${campStyles['shop-purchase-status']}" role="status">${owned ? t.owned : remaining ? message(language, 'camp-copy.need-count-more-supplies', { count: number.format(remaining) }) : ''}</p>
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

  return `<p class="variant-intro ${sharedStyles['variant-intro']}">${campLabel(language, 'purchaseHelp')}</p>
    <div class="shop-filters ${campStyles['shop-filters']}" role="group" aria-label="${campPageName(language, 'shop')}">${CATEGORIES.map((category) => `<button data-control="shop-category:${category}" aria-pressed="${screen.category === category}">${shopCategoryName(language, category)}</button>`).join('')}</div>
    <div class="shop-grid ${campStyles['shop-grid']}">${items
      .map((item, index) => {
        const description = upgradeCopy(language, item)
        const owned = camp.upgrades.includes(item)
        const price = number.format(upgradeCost(item))
        const row = Math.floor(index / 3)
        const label = `${description.name}, ${price} ${t.supplies}${owned ? `, ${t.owned}` : ''}`

        return `<button class="shop-tile ${campStyles['shop-tile']}" data-control="shop-item:${item}" aria-pressed="${item === selected}" aria-controls="shop-detail" aria-label="${escapeHtml(label)}" style="--tile-column:${(index % 6) + 1};--tile-row:${Math.floor(index / 6) + 1};--compact-column:${(index % 4) + 1};--compact-row:${Math.floor(index / 4) + 1};--mobile-column:${(index % 3) + 1};--mobile-row:${row + 1 + Number(row > selectedRow)}">
        ${owned ? `<span class="shop-owned ${campStyles['shop-owned']}" aria-hidden="true">✓</span>` : ''}${spriteImage(shopSprite(item))}<strong>${description.name}</strong><span class="shop-price ${campStyles['shop-price']}">${price}</span></button>${item === selected ? shopDetail(language, camp, item, index, items.length) : ''}`
      })
      .join('')}</div>`
}

/** Render one camp screen while preserving the current profession, loadout and route. */
export function campTemplate(
  language: Language,
  camp: Camp,
  profession: Profession,
  equipment: readonly Equipment[],
  screen: CampScreen,
): string {
  const t = variantCopy(language)
  const number = new Intl.NumberFormat(language)
  let content: string
  switch (screen.page) {
    case 'professions':
      content = professionsTemplate(language, camp, profession)
      break
    case 'equipment':
      content = equipmentTemplate(language, camp, profession, equipment)
      break
    case 'missions':
    case 'achievements':
      content = milestonesTemplate(language, camp, screen.page)
      break
    case 'shop':
      content = shopTemplate(language, camp, screen)
      break
  }

  return `<section class="camp-panel ${sharedStyles['camp-panel']}" data-camp-page="${screen.page}">
    <header class="camp-header ${campStyles['camp-header']}"><div><h1 tabindex="-1">${campPageName(language, screen.page)}</h1></div><div class="camp-wallet ${campStyles['camp-wallet']}">${spriteImage('treasure')}<div><span>${t.supplies}</span><strong>${number.format(camp.supplies)}</strong></div></div></header>
    ${content}
  </section>`
}
