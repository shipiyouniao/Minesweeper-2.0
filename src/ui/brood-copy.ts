import type { Language } from '../types/localization.js'
import type { BroodEncounter } from '../types/tactical.js'

/** Identify an actionable occupant and its complete public cost in pointer and keyboard labels. */
export function broodCellLabel(
  language: Language,
  encounter: BroodEncounter,
  index: number,
): string {
  const egg = encounter.eggs.find((entry) => entry.index === index)
  if (egg)
    return language === 'zh'
      ? `虫卵 · ${egg.turns} 回合后孵化 · 相邻清除 1 点`
      : language === 'ja'
        ? `卵 · 孵化まで${egg.turns}ターン · 隣接除去1`
        : `Egg · hatches in ${egg.turns} turns · clear adjacent for 1 AP`
  if (encounter.webs.includes(index))
    return language === 'zh'
      ? '蛛网 · 相邻清除 1 点'
      : language === 'ja'
        ? '巣網 · 隣接除去1'
        : 'Web · clear adjacent for 1 AP'
  return language === 'zh'
    ? '幼虫 · 相邻消灭 1 点'
    : language === 'ja'
      ? '幼体 · 隣接撃破1'
      : 'Hatchling · clear adjacent for 1 AP'
}
