import { battleText } from './combat-build-copy.js'
import type { Language } from '../types/localization.js'
import type { TitleId } from '../types/titles.js'

/** Describe the equipped title's exact condition and bounded reward in every supported locale. */
export function titleEffectCopy(language: Language, title: TitleId): string {
  const t = (en: string, zh: string, ja: string): string => battleText(language, en, zh, ja)
  switch (title) {
    case 'bastion-flawless':
      return t('Defense +1 while braced.', '防守时，防御 +1。', '防御態勢中、防御 +1。')
    case 'mirror-flawless':
      return t(
        'Gain 1 shield when entering a boss room, up to 2.',
        '进入 Boss 房获得 1 层护盾，上限 2 层。',
        'ボス部屋に入るとシールド +1。上限2。',
      )
    case 'clock-no-glass':
      return t(
        'Every third boss turn starts with +1 AP, up to 5.',
        'Boss 战每逢第 3 的倍数回合，行动力 +1，上限 5。',
        'ボス戦の3の倍数ターンは行動力 +1。上限5。',
      )
    case 'magnetic-demolition':
      return t(
        'Attack +2 while the Magnetic Knight is exposed.',
        '磁力骑士破甲期间，攻击 +2。',
        '磁力騎士の装甲破壊中、攻撃 +2。',
      )
    case 'brood-nest-spared':
      return t(
        'Attack +2 against the Brood Queen while a nest remains.',
        '育巢女王仍有巢穴时，攻击 +2。',
        '巣が残る育巣女王に対して攻撃 +2。',
      )
    case 'web-untouched':
      return t(
        'Defense +1 in the Brood Queen battle.',
        '育巢女王战中，防御 +1。',
        '育巣女王戦で防御 +1。',
      )
    case 'field-unscathed':
      return t(
        'Depart with 1 extra probe, up to 4.',
        '出发时额外携带 1 个探针，上限 4。',
        '出発時にプローブ +1。上限4。',
      )
    case 'veteran':
      return t(
        'Maximum health +1 for this expedition.',
        '本次远征生命上限 +1。',
        '今回の遠征で最大HP +1。',
      )
    case 'relic-curator':
      return t(
        'With fewer than 3 relics, reward offers have 1 extra choice, up to 5.',
        '持有不足 3 件遗物时，奖励多 1 个候选，上限 5。',
        '遺物が3個未満なら報酬候補 +1。上限5。',
      )
    case 'boss-slayer':
      return t(
        'Attack +1 against a boss at half health or less.',
        'Boss 生命不高于一半时，攻击 +1。',
        'ボスのHPが半分以下なら攻撃 +1。',
      )
    case 'four-legends':
      return t(
        'Recover 2 health when entering a boss room.',
        '进入 Boss 房恢复 2 点生命。',
        'ボス部屋に入るとHPを2回復。',
      )
    case 'abyss-clear':
      return t(
        'Attack +1 while your health is at half or less.',
        '自身生命不高于一半时，攻击 +1。',
        '自身のHPが半分以下なら攻撃 +1。',
      )
    case 'long-road':
      return t(
        'The first chest each floor restores 1 health.',
        '每层收集的第一个宝箱恢复 1 点生命。',
        '各階の最初の宝箱でHPを1回復。',
      )
    case 'world-walker':
      return t(
        'The first turn of each boss battle starts with +1 AP, up to 5.',
        '每场 Boss 战首回合行动力 +1，上限 5。',
        '各ボス戦の第1ターンは行動力 +1。上限5。',
      )
    case 'treasure-vault':
      return t(
        'The first two chests of the expedition each grant 1 probe, up to 4.',
        '本次远征前两个宝箱各补充 1 个探针，上限 4。',
        '遠征の最初の宝箱2個でプローブを各1補充。上限4。',
      )
    case 'treasure-legend':
      return t(
        'The third chest of the expedition grants 1 scanner, up to 4.',
        '本次远征第三个宝箱补充 1 个扫描器，上限 4。',
        '遠征の3個目の宝箱でスキャナー +1。上限4。',
      )
    case 'skill-master':
      return t(
        'Completing your profession skill restores 1 health, once per floor.',
        '成功使用职业技能恢复 1 点生命，每层一次。',
        '職業スキルの成功でHPを1回復。各階1回。',
      )
    case 'skill-legend':
      return t(
        'Completing your profession skill in battle refunds 1 AP, up to 5; once per floor.',
        'Boss 战成功使用职业技能返还 1 点行动力，上限 5，每层一次。',
        'ボス戦で職業スキルが成功すると行動力を1返還。上限5、各階1回。',
      )
    case 'depth-pioneer':
      return t(
        'Depart with 1 extra scanner, up to 4.',
        '出发时额外携带 1 个扫描器，上限 4。',
        '出発時にスキャナー +1。上限4。',
      )
    case 'depth-legend':
      return t(
        'Entering floors 4 and 7 each adds 1 maximum health and restores 1 health.',
        '进入第 4、7 层时，生命上限各 +1，并恢复 1 点生命。',
        '4階と7階に入るたび最大HP +1、HPを1回復。',
      )
    case 'relic-museum':
      return t(
        'With 3 or more relics, reward offers have 1 extra choice, up to 5.',
        '持有至少 3 件遗物时，奖励多 1 个候选，上限 5。',
        '遺物が3個以上なら報酬候補 +1。上限5。',
      )
    case 'abyss-veteran':
      return t(
        'Defense +1 while your health is at one third or less.',
        '自身生命不高于三分之一时，防御 +1。',
        '自身のHPが3分の1以下なら防御 +1。',
      )
  }
}
