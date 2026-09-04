import type { Language } from '../types/localization.js'
import type { Expedition } from '../types/variants.js'
import type { ExpeditionDialogPhase } from '../types/variant-ui.js'
import { relicRewardTemplate, expeditionResultTemplate } from './variant-templates.js'

/** Own reward and result modals, automatic opening, and focus after dismissal or selection. */
export class ExpeditionDialog {
  private readonly dialog: HTMLDialogElement
  private readonly root: HTMLElement
  private readonly language: Language
  private readonly listeners = new AbortController()
  private phase: ExpeditionDialogPhase | null = null

  /** Keep expedition choices separate from help and destructive-action confirmation. */
  constructor(root: HTMLElement, language: Language) {
    this.root = root
    this.language = language
    this.dialog = document.createElement('dialog')
    this.dialog.className = 'expedition-dialog'
    this.dialog.setAttribute('aria-labelledby', 'expedition-dialog-title')
    root.append(this.dialog)
    this.dialog.addEventListener('close', this.restoreFocus, { signal: this.listeners.signal })
  }

  /** Report actual native visibility, including Escape dismissal. */
  get open(): boolean {
    return this.dialog.open
  }

  /** Permit only the command family belonging to the visible presentation phase. */
  get rewardOpen(): boolean {
    return this.open && this.phase === 'reward'
  }

  /** Settlement dialogs only allow returning to camp or dismissing the presentation. */
  get resultOpen(): boolean {
    return this.open && this.phase !== 'reward'
  }

  /** Open once per presentation phase, including pending-reward recovery and pause resume. */
  render(run: Expedition | null, paused: boolean): void {
    const phase =
      !paused && run && run.phase !== 'exploring' && run.phase !== 'boss' ? run.phase : null
    if (phase === null) this.close()
    else if (phase !== this.phase && run) this.show(run)

    // Dismissal preserves the phase without reopening on unrelated repaints.
    this.phase = phase
  }

  /** Reopen the current offers or settlement without changing rewards or the journal. */
  show(run: Expedition): void {
    if (run.phase === 'exploring' || run.phase === 'boss' || this.open) return
    this.phase = run.phase
    this.dialog.classList.toggle('relic-dialog', run.phase === 'reward')
    this.dialog.classList.toggle('expedition-result-dialog', run.phase !== 'reward')
    this.dialog.innerHTML =
      run.phase === 'reward'
        ? relicRewardTemplate(this.language, run)
        : expeditionResultTemplate(this.language, run)
    this.dialog.showModal()
  }

  /** Dismiss presentation only; pending offers and committed settlements remain intact. */
  close(): void {
    if (this.open) this.dialog.close()
  }

  /** Return focus to the current trigger, the newly entered floor, or the camp heading. */
  private readonly restoreFocus = (): void => {
    if (this.root.querySelector('dialog[open], .variant-content[hidden]')) return
    const target = this.root.querySelector<HTMLElement>(
      '[data-control="rewards"], [data-control="result"], .camp-panel h1, [data-side="a"] [tabindex="0"]',
    )
    target?.focus({ preventScroll: true })
  }

  /** Release queued focus work before navigation replaces the owning game. */
  dispose(): void {
    this.listeners.abort()
    this.close()
    this.dialog.remove()
  }
}
