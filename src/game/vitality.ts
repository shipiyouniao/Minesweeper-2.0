import type { Vitality } from '../types/vitality.js'

/** Spend shields before health; damage cannot underflow or revive a defeated character. */
export function damageVitality(vitality: Vitality, damage: number): Vitality {
  if (!Number.isSafeInteger(damage) || damage <= 0 || vitality.health === 0) return vitality

  const absorbed = Math.min(vitality.shields, damage)

  return {
    ...vitality,
    shields: vitality.shields - absorbed,
    health: Math.max(0, vitality.health - (damage - absorbed)),
  }
}

/** Restore living characters up to their existing maximum without replenishing shields. */
export function healVitality(vitality: Vitality, healing: number): Vitality {
  if (
    !Number.isSafeInteger(healing) ||
    healing <= 0 ||
    vitality.health === 0 ||
    vitality.health === vitality.maxHealth
  )
    return vitality

  return { ...vitality, health: Math.min(vitality.maxHealth, vitality.health + healing) }
}
