import { MILESTONES, milestoneProgress, milestoneValue } from './milestones.js'
import type { Camp } from '../types/variants.js'
import type { MilestoneNotice } from '../types/milestone-notices.js'

/** Emit halfway and completion crossings once, with completion taking precedence. */
export function milestoneNotices(before: Camp, after: Camp): MilestoneNotice[] {
  return MILESTONES.flatMap((entry) => {
    if (milestoneProgress(before).claimed.includes(entry.id)) return []
    const previous = milestoneValue(before, entry)
    const value = Math.min(entry.target, milestoneValue(after, entry))
    const halfway = Math.ceil(entry.target / 2)
    return (previous < entry.target && value >= entry.target) ||
      (previous < halfway && value >= halfway)
      ? [{ entry, value }]
      : []
  })
}
