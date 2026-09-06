import { milestoneNotices } from '../game/milestone-notices.js'
import { milestoneCopy } from './milestone-copy.js'
import { battleText } from './combat-build-copy.js'
import type { Camp } from '../types/variants.js'
import type { Language } from '../types/localization.js'
import type { MilestoneNotice } from '../types/milestone-notices.js'

/** One visible card at a time; modals and hidden tabs pause its reading time. */
export class MilestoneNotices {
  private previous: Camp | null = null
  private language: Language = 'en'
  private queue: MilestoneNotice[] = []
  private card: HTMLElement | null = null
  private timer: ReturnType<typeof setTimeout> | null = null
  private remaining = 0

  /** Queue newly crossed goal thresholds while retaining the previous camp snapshot. */
  observe(camp: Camp, language: Language): void {
    this.language = language
    if (this.previous) this.queue.push(...milestoneNotices(this.previous, camp))
    this.previous = camp
    if (this.queue.length && this.timer === null) this.tick()
  }

  /** Display one queued notice at a time and suspend its lifetime while the game is obscured. */
  private tick(): void {
    this.timer = null
    const paused = document.hidden || document.querySelector('dialog[open]') !== null
    if (this.card) this.card.hidden = paused
    if (!paused) {
      if (this.card && this.remaining <= 0) {
        this.card.remove()
        this.card = null
      }
      if (!this.card) {
        const notice = this.queue.shift()
        if (notice) {
          const { entry, value } = notice
          const done = value === entry.target
          const t = (en: string, zh: string, ja: string): string =>
            battleText(this.language, en, zh, ja)
          this.card = document.createElement('section')
          this.card.className = `milestone-toast${done ? ' is-complete' : ''}`
          this.card.setAttribute('role', 'status')
          this.card.setAttribute('aria-live', 'polite')
          this.card.innerHTML = `<div class="toast-symbol" aria-hidden="true">${done ? '✓' : '✦'}</div><div class="toast-content"><small>${entry.kind === 'missions' ? t('Mission', '任务', '任務') : t('Achievement', '成就', '実績')} · ${done ? t('Completed', '已完成', '達成') : t('Halfway there', '进度过半', '半分達成')}</small><strong>${milestoneCopy(this.language, entry.id).name}</strong><div class="toast-progress"><progress max="${entry.target}" value="${value}" aria-label="${milestoneCopy(this.language, entry.id).name}"></progress><span>${value} / ${entry.target}</span></div></div><button aria-label="${t('Dismiss', '关闭提示', '閉じる')}">×</button>`
          this.card.querySelector('button')?.addEventListener('click', () => {
            this.remaining = 0
          })
          document.body.append(this.card)
          this.remaining = 4500
        }
      }
      this.remaining -= 250
    }
    if (this.card || this.queue.length) this.timer = setTimeout(() => this.tick(), 250)
  }

  /** Cancel the pending tick and remove transient notices when their owner is disposed. */
  dispose(): void {
    if (this.timer !== null) clearTimeout(this.timer)
    this.card?.remove()
    this.card = null
    this.timer = null
    this.queue = []
  }
}
