import { battleText } from './combat-build-copy.js'
import type { Language } from '../types/localization.js'
import type { MilestoneId } from '../types/milestones.js'
import type { VariantDescription } from '../types/variant-ui.js'

/** Goals describe counted actions and finite rewards consistently in all locales. */
export function milestoneCopy(language: Language, id: MilestoneId): VariantDescription {
  const t = (en: string, zh: string, ja: string): string => battleText(language, en, zh, ja)
  switch (id) {
    case 'first-steps':
      return {
        name: t('First footsteps', '踏上旅途', '旅の第一歩'),
        note: t(
          'Visit 20 new safe squares across expeditions. Backtracking does not count.',
          '累计走过 20 个新的安全格。同层重复走过不计数。',
          '遠征で新しい安全マスを合計20個歩く。同じ階の往復は数えない。',
        ),
      }
    case 'treasure-scout':
      return {
        name: t('Treasure scout', '寻宝入门', '宝探し入門'),
        note: t(
          'Collect 3 treasure chests across expeditions.',
          '累计拾取 3 个宝箱。',
          '遠征で宝箱を合計3個拾う。',
        ),
      }
    case 'field-practice':
      return {
        name: t('Field practice', '技能实战', '実地訓練'),
        note: t(
          'Successfully use a profession skill 3 times.',
          '累计成功使用 3 次职业技能。',
          '職業スキルを合計3回成功させる。',
        ),
      }
    case 'floor-runner':
      return {
        name: t('Beyond the entrance', '深入地下', '地下への旅'),
        note: t(
          'Clear 5 floors across expeditions.',
          '累计通过 5 层地牢。',
          '遠征で合計5階を突破する。',
        ),
      }
    case 'first-boss':
      return {
        name: t('First challenger', '初战告捷', '最初の挑戦'),
        note: t('Defeat your first boss.', '击败任意 1 个 BOSS。', '初めてボスを倒す。'),
      }
    case 'veteran':
      return {
        name: t('Seasoned explorer', '远征老兵', '熟練の冒険者'),
        note: t(
          'Win 3 expeditions. Existing camp victories count.',
          '通关 3 次远征，已有营地通关记录也计入。',
          '遠征を3回クリア。既存のキャンプのクリア数も含む。',
        ),
      }
    case 'relic-curator':
      return {
        name: t('Relic curator', '遗物收藏家', '遺物収集家'),
        note: t(
          'Acquire 8 different relics across expeditions. Offers alone do not count.',
          '累计实际获得 8 种不同遗物，仅看到候选不计数。',
          '遠征で異なる遺物を8種類獲得。候補に出ただけでは数えない。',
        ),
      }
    case 'boss-slayer':
      return {
        name: t('Boss hunter', '讨伐专家', 'ボスハンター'),
        note: t(
          'Defeat 10 bosses across expeditions.',
          '累计击败 10 个 BOSS。',
          '遠征でボスを合計10体倒す。',
        ),
      }
    case 'four-legends':
      return {
        name: t('Four legends', '四大强敌', '四つの伝説'),
        note: t(
          'Defeat Bastion Guardian, Brood Queen, Mirror Twins and Magnetic Knight.',
          '分别击败堡垒守卫、虫群女王、镜像双子和磁力骑士。',
          '要塞の守護者、群れの女王、鏡の双子、磁力の騎士をそれぞれ倒す。',
        ),
      }
    case 'abyss-clear':
      return {
        name: t('Into the abyss', '深渊征服者', '深淵の征服者'),
        note: t(
          'Win an expedition on Abyss difficulty.',
          '在深渊难度通关 1 次远征。',
          '深淵の難易度で遠征を1回クリアする。',
        ),
      }
  }
}
