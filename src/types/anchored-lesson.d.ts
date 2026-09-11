/** Scene owners provide their visible play surface and any fixed input dock. */
export interface LessonSurface {
  readonly frame: HTMLElement
  readonly viewport: HTMLElement
  readonly dock: HTMLElement | null
}
