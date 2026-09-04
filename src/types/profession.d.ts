/** A profession trades starting information and protection within fixed resource caps. */
export interface ProfessionResources {
  readonly probes: number
  readonly scans: number
  readonly shields: number
}

/** Public reasons explain unavailable skills without inspecting hidden mine values. */
export type SkillAvailability =
  'ready' | 'used' | 'legacy' | 'inactive' | 'no-information' | 'resources'
