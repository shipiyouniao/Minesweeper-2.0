import type { Language } from '../types/localization.js'
import type { Expedition } from '../types/variants.js'
import { relicRewardTemplate } from './variant-templates.js'

/** Own the inter-floor modal, automatic opening, and focus after dismissal or selection. */
export class RelicDialog {
  private readonly dialog: HTMLDialogElement
  private readonly root: HTMLElement
  private readonly language: Language
  private readonly listeners = new AbortController()
  private available = false

  /** Create a separate modal so help and confirmation cannot consume reward commands. */
  constructor(root: HTMLElement, language: Language) {
    this.root = root
    this.language = language
    this.dialog = document.createElement('dialog')
    this.dialog.className = 'relic-dialog'
    this.dialog.setAttribute('aria-labelledby', 'relic-dialog-title')
    root.append(this.dialog)
    this.dialog.addEventListener('close', this.restoreFocus, { signal: this.listeners.signal })
  }

  /** Report actual native visibility, including Escape dismissal. */
  get open(): boolean {
    return this.dialog.open
  }

  /** Open once on entering a reward phase, including journal recovery and pause resume. */
  render(run: Expedition | null, paused: boolean): void {
    const available = run?.phase === 'reward' && !paused
    if (!available) this.close()
    else if (!this.available) this.show(run)

    // Dismissing the popup keeps the offer pending without reopening on unrelated repaints.
    this.available = available
  }

  /** Reopen the same offers without recording an action or regenerating the choices. */
  show(run: Expedition): void {
    if (run.phase !== 'reward' || this.open) return
    this.dialog.innerHTML = relicRewardTemplate(this.language, run)
    this.dialog.showModal()
  }

  /** Dismiss presentation only; the session retains its pending reward. */
  close(): void {
    if (this.open) this.dialog.close()
  }

  /** Return focus to the pending reward trigger or the newly entered floor. */
  private readonly restoreFocus = (): void => {
    if (this.root.querySelector('dialog[open], .variant-content[hidden]')) return
    const target = this.root.querySelector<HTMLElement>(
      '[data-control="rewards"], [data-side="a"] [tabindex="0"]',
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
