import type { BoardControlAttribute, BoardControlsCopy } from '../types/board-controls.js'
import type { BoardInputMode } from '../types/ui.js'
import type { Language } from '../types/localization.js'
import { translations } from '../i18n.js'
import { icon } from '../icons.js'

/** Keep pointer instructions independent of keyboard shortcuts and complete in all locales. */
function controlsCopy(language: Language): BoardControlsCopy {
  if (language === 'zh')
    return {
      label: '棋盘操作',
      reveal: '点格子挖开；远征中也可点击已开格移动。',
      flag: '点未开的格子插旗，再点取消。',
      safe: '点未开的格子标记疑似安全，再点取消。',
      chord: '点已开格挖周围安全标记；旗数匹配时也挖未知格。',
      gestures: '右键 / 长按：循环标记，或快速挖开周围。',
    }
  if (language === 'ja')
    return {
      label: '盤面の操作',
      reveal: 'マスを押して開きます。遠征では開いたマスへ移動できます。',
      flag: '未開封のマスを押して旗を立て、もう一度押すと解除。',
      safe: '未開封のマスを押して安全メモ、もう一度押すと解除。',
      chord: '開いたマスを押して周囲の安全印を掘ります。旗数が合えば未確定のマスも開きます。',
      gestures: '右クリック / 長押し：印を切り替え、周囲を開きます。',
    }
  return {
    label: 'Board actions',
    reveal: 'Select a cell to dig; in Expedition, select open ground to move.',
    flag: 'Select a covered cell to flag it; select it again to clear.',
    safe: 'Select a covered cell to note suspected safety; select it again to clear.',
    chord:
      'Select an open cell to dig nearby safe marks; matching flags also open unknown neighbors.',
    gestures: 'Right-click / hold: cycle marks, or quick-open neighbors.',
  }
}

/** Explain what the next ordinary click or tap will do, rather than an invisible focus position. */
export function boardControlHint(language: Language, mode: BoardInputMode): string {
  const copy = controlsCopy(language)
  return mode === 'reveal'
    ? copy.reveal
    : mode === 'flag'
      ? copy.flag
      : mode === 'mark-safe'
        ? copy.safe
        : copy.chord
}

/** Cycle one visible control while retaining mouse shortcuts and direct keyboard commands. */
export function nextBoardMode(mode: BoardInputMode): BoardInputMode {
  return mode === 'reveal'
    ? 'flag'
    : mode === 'flag'
      ? 'mark-safe'
      : mode === 'mark-safe'
        ? 'chord'
        : 'reveal'
}

/** Render the shared pointer and touch mode switch with its current accessible label. */
export function boardControlsTemplate(
  language: Language,
  mode: BoardInputMode,
  attribute: BoardControlAttribute,
): string {
  const t = translations[language]
  const label =
    mode === 'reveal'
      ? t.reveal
      : mode === 'flag'
        ? t.flag
        : mode === 'mark-safe'
          ? t.markSafe
          : t.quickReveal
  const cycle = language === 'zh' ? '点按切换' : language === 'ja' ? '押して切替' : 'Tap to cycle'
  return `<button class="dock-slot mode-cycle" ${attribute}="cycle-mode" data-mode="${mode}" aria-label="${label} · ${cycle}" title="${boardControlHint(language, mode)}">${icon(mode === 'flag' ? 'flag' : mode === 'mark-safe' ? 'check' : 'pointer')}<strong>${label}</strong><small>${cycle} ↻</small></button>`
}
