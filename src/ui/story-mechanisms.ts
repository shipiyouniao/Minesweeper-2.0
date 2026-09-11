import { clueIsolated } from '../game/clue-isolation.js'
import { message } from '../i18n.js'
import type { Language } from '../types/localization.js'
import type { StoryMechanism, StoryRun } from '../types/story.js'
import { spriteImage } from './dungeon-sprites.js'
import { escapeHtml } from './presentation.js'

/** Controls have named functions while their numeral retains standard mine semantics. */
export function storyMechanismName(language: Language, control: StoryMechanism): string {
  return control.kind === 'brake'
    ? message(language, 'story.brake')
    : message(language, 'story.winch')
}

/** Closed gates are visible terrain, not trees or misleading safe buttons. */
export function storyGateTemplate(run: StoryRun, language: Language, index: number): string | null {
  const control = run.board.scene.mechanisms?.find((entry) => entry.gate === index)
  if (!control || run.operated.includes(control.index)) return null

  return `<div class="story-mechanism-gate" data-story-gate="${index}" role="img" aria-label="${escapeHtml(message(language, 'story.gate-closed'))}">${spriteImage('bastion-core')}</div>`
}

/** Explain the current physical objective next to the board instead of opening another tutorial. */
export function storyMechanismHint(run: StoryRun, language: Language): string {
  const control = run.board.scene.mechanisms?.find((entry) => !run.operated.includes(entry.index))
  if (!control) return ''

  const ready = clueIsolated(run.board, control.index)
  const text = ready
    ? message(language, 'story.mechanism-ready', { name: storyMechanismName(language, control) })
    : message(language, 'story.mechanism-help', { name: storyMechanismName(language, control) })

  return `<p class="story-mechanism-hint" data-mechanism-hint>${text}</p>`
}
