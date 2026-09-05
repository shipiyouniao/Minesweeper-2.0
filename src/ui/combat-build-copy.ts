import type { Language } from '../types/localization.js'
import type { CombatPurchase, CombatRelic } from '../types/combat-build.js'
import type { VariantDescription } from '../types/variant-ui.js'
import type { DungeonSprite } from '../types/dungeon-ui.js'
import type { Equipment } from '../types/variants.js'

/** Require an English, Chinese and Japanese string at every new player-facing entry. */
export function battleText(language: Language, en: string, zh: string, ja: string): string {
  return language === 'zh' ? zh : language === 'ja' ? ja : en
}

/** Explain licenses and finite training without promising a number of runs to afford them. */
export function combatPurchaseCopy(language: Language, item: CombatPurchase): VariantDescription {
  /** Bind a complete translation triplet to this catalog entry. */
  const t = (en: string, zh: string, ja: string): string => battleText(language, en, zh, ja)
  switch (item) {
    case 'steel-blade':
      return {
        name: t('Steel blade', '精钢短刃', '鋼の短剣'),
        note: t(
          '2 loadout points. Attack +2.',
          '装备预算 2 点。攻击 +2。',
          '装備2ポイント。攻撃+2。',
        ),
      }
    case 'plated-vest':
      return {
        name: t('Plated vest', '鳞甲背心', '鱗鎧のベスト'),
        note: t(
          '2 loadout points. Defense +1 against enemy attacks; does not reduce mine damage.',
          '装备预算 2 点。防御 +1，减少敌方攻击伤害，不减免踩雷伤害。',
          '装備2ポイント。防御+1。敵の攻撃を軽減、地雷には無効。',
        ),
      }
    case 'field-boots':
      return {
        name: t('Field boots', '行军靴', '行軍ブーツ'),
        note: t(
          '2 loadout points. +1 AP on even turns, up to 5.',
          '装备预算 2 点。偶数回合行动力 +1，总上限 5。',
          '装備2ポイント。偶数ターンの行動力+1、上限5。',
        ),
      }
    case 'medical-kit':
      return {
        name: t('Medical kit', '医疗包', '医療キット'),
        note: t(
          '1 loadout point. Starting and maximum health +2.',
          '装备预算 1 点。初始生命与生命上限 +2。',
          '装備1ポイント。初期・最大体力+2。',
        ),
      }
    case 'focus-lens':
      return {
        name: t('Focus lens', '校准透镜', '調整レンズ'),
        note: t(
          '1 loadout point. The first pylon or nest completed each turn refunds 1 AP.',
          '装备预算 1 点。每回合首次关闭机关或摧毁巢穴，返还 1 点行动力。',
          '装備1ポイント。毎ターン最初の装置停止・巣破壊で行動力1回復。',
        ),
      }
    case 'clearing-hook':
      return {
        name: t('Clearing hook', '破障钩', '障害除去フック'),
        note: t(
          '1 loadout point. The first web, egg or hatchling cleared each turn refunds 1 AP.',
          '装备预算 1 点。每回合首次清除蛛网、虫卵或幼虫，返还 1 点行动力。',
          '装備1ポイント。毎ターン最初の巣網・卵・幼体除去で行動力1回復。',
        ),
      }
    case 'battle-manual':
      return {
        name: t('Battle manual', '战术手册', '戦術教本'),
        note: t(
          'Add attack, defense and action-point relics to future expedition rewards.',
          '将攻击、防御和行动力遗物加入后续远征奖励池。',
          '攻撃・防御・行動力の遺物を今後の遠征報酬に追加。',
        ),
      }
    case 'vitality-training':
      return {
        name: t('Endurance training', '耐力训练', '持久力訓練'),
        note: t(
          'One purchase only. Starting and maximum health +1 on future departures.',
          '仅可购买一次。此后出发的初始生命与生命上限 +1。',
          '購入は1回のみ。今後の初期・最大体力+1。',
        ),
      }
    case 'weapon-training':
      return {
        name: t('Weapon training', '武器训练', '武器訓練'),
        note: t(
          'One purchase only. Base attack +1 on future departures.',
          '仅可购买一次。此后出发的基础攻击 +1。',
          '購入は1回のみ。今後の基本攻撃+1。',
        ),
      }
  }
}

/** Direct relic bonuses remain stronger than finite permanent training. */
export function combatRelicCopy(language: Language, relic: CombatRelic): VariantDescription {
  switch (relic) {
    case 'tempered-edge':
      return {
        name: battleText(language, 'Tempered edge', '淬火锋刃', '焼入れの刃'),
        note: battleText(
          language,
          'Attack +3 for this expedition.',
          '本次远征攻击 +3。',
          'この遠征の攻撃+3。',
        ),
      }
    case 'layered-armor':
      return {
        name: battleText(language, 'Layered armor', '层叠护甲', '重ね鎧'),
        note: battleText(
          language,
          'Defense +1 against enemy attacks for this expedition.',
          '本次远征防御 +1，减免敌方攻击伤害。',
          'この遠征で敵の攻撃に対する防御+1。',
        ),
      }
    case 'tactics-hourglass':
      return {
        name: battleText(language, 'Tactics hourglass', '战术沙漏', '戦術の砂時計'),
        note: battleText(
          language,
          '+1 AP every combat turn, up to 5.',
          '每个战斗回合行动力 +1，总上限 5。',
          '戦闘の各ターンで行動力+1、上限5。',
        ),
      }
  }
}

/** Reuse the matching project-owned inventory artwork for each tactical equipment role. */
export function combatSprite(item: CombatPurchase | Equipment | CombatRelic): DungeonSprite {
  switch (item) {
    case 'steel-blade':
    case 'weapon-training':
    case 'tempered-edge':
      return 'bastion-strike'
    case 'plated-vest':
    case 'layered-armor':
      return 'guardian-crests'
    case 'field-boots':
      return 'wayfarer-tokens'
    case 'medical-kit':
    case 'vitality-training':
      return 'survival-charms'
    case 'focus-lens':
      return 'scanner'
    case 'clearing-hook':
      return 'salvager-kit'
    case 'battle-manual':
      return 'duelist-marks'
    case 'tactics-hourglass':
      return 'chronologist-dials'
    case 'guard':
      return 'shield'
    default:
      return item
  }
}

/** Present the new vitality scale consistently in camp, exploration and help. */
export function battleHealthCopy(language: Language): string {
  return battleText(
    language,
    'Mines deal 5 damage. Each shield absorbs up to 5; floor exits restore 5 health. Armor reduces enemy attacks only.',
    '地雷造成 5 点伤害。每层护盾最多吸收 5 点；过层恢复 5 点生命。护甲只减免敌方攻击。',
    '地雷は5ダメージ。シールド1つで最大5吸収、階層突破で体力5回復。防具は敵の攻撃のみ軽減。',
  )
}
