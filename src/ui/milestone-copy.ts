import { battleText } from './combat-build-copy.js'
import type { Language } from '../types/localization.js'
import type { MilestoneId } from '../types/milestones.js'
import type { VariantDescription } from '../types/variant-ui.js'

/** Goals describe counted actions and finite rewards consistently in all locales. */
export function milestoneCopy(language: Language, id: MilestoneId): VariantDescription {
  const t = (en: string, zh: string, ja: string): string => battleText(language, en, zh, ja)
  switch (id) {
    case 'bastion-flawless':
      return {
        name: t('Untouched bulwark', '不动如山', '不動の砦'),
        note: t(
          'Defeat the bastion without losing health. Revival counts as damage.',
          '整场战斗不损失生命，击败壁垒守卫。触发复活也算受伤。',
          'HPを失わず砦を倒す。復活も被弾に含む。',
        ),
      }
    case 'mirror-flawless':
      return {
        name: t('Beyond the mirror', '镜外之人', '鏡の向こう'),
        note: t(
          'Defeat both twins without losing health. Revival counts as damage.',
          '整场战斗不损失生命，击败镜像双子。触发复活也算受伤。',
          'HPを失わず双子を倒す。復活も被弾に含む。',
        ),
      }
    case 'clock-no-glass':
      return {
        name: t('Against the clock', '逆时而行', '時に抗う者'),
        note: t(
          'Defeat the clock boss using exactly one arena hourglass.',
          '整场只使用一座沙漏，击败时钟 BOSS。',
          '砂時計をちょうど1つ使って時計ボスを倒す。',
        ),
      }
    case 'magnetic-demolition':
      return {
        name: t('Demolition expert', '爆破专家', '爆破の達人'),
        note: t(
          'Lure a charge into at least one mine, then defeat the magnetic boss.',
          '引诱磁力 BOSS 冲撞引爆至少一枚地雷，并击败它。',
          '突進で地雷を爆破させ、磁力ボスを倒す。',
        ),
      }
    case 'brood-nest-spared':
      return {
        name: t('Into the nest', '虎口拔牙', '巣への挑戦'),
        note: t(
          'Defeat the queen while leaving at least one nest intact.',
          '保留至少一座巢穴，击败育巢女王。',
          '巣を一つ以上残して女王を倒す。',
        ),
      }

    case 'hunt-bastion':
      return {
        name: t('Break the bastion', '攻破壁垒', '砦を崩せ'),
        note: t('Defeat this boss once.', '击败该 BOSS 一次。', 'このボスを1回倒す。'),
      }
    case 'hunt-brood':
      return {
        name: t('Queen hunt', '猎杀育巢女王', '女王討伐'),
        note: t('Defeat this boss once.', '击败该 BOSS 一次。', 'このボスを1回倒す。'),
      }
    case 'hunt-mirror':
      return {
        name: t('Twin hunt', '击败镜像双子', '双子討伐'),
        note: t('Defeat this boss once.', '击败该 BOSS 一次。', 'このボスを1回倒す。'),
      }
    case 'hunt-magnetic':
      return {
        name: t('Magnet hunt', '击败磁力守卫', '磁力討伐'),
        note: t('Defeat this boss once.', '击败该 BOSS 一次。', 'このボスを1回倒す。'),
      }
    case 'hunt-clock':
      return {
        name: t('Clock hunt', '击败时钟守卫', '時計討伐'),
        note: t('Defeat this boss once.', '击败该 BOSS 一次。', 'このボスを1回倒す。'),
      }
    case 'web-untouched':
      return {
        name: t('Web walker', '蛛网漫步者', '蜘蛛の巣を歩む者'),
        note: t(
          'Defeat the Brood Queen without clearing any webs during the fight.',
          '整场战斗不清理任何蛛网，击败育巢女王。',
          '戦闘中に蜘蛛の巣を一切除去せず女王を倒す。',
        ),
      }
    case 'field-unscathed':
      return {
        name: t('Master of magnetism', '磁场掌控者', '磁場の使い手'),
        note: t(
          'Defeat the magnetic boss without being pushed or pulled onto a mine. Shields do not excuse mine contact.',
          '整场战斗不被磁场推拉到地雷上，并击败磁力 BOSS。护盾挡住伤害也算碰雷。',
          '磁場で地雷に触れず磁力ボスを倒す。盾で防いでも接触は失敗。',
        ),
      }

    case 'trail-apprentice':
      return {
        name: t('Trail apprentice', '行路学徒', '旅の見習い'),
        note: t(
          'Total: 60 new safe squares visited.',
          '累计 60 个新的安全格（同层重复不计）。',
          '累計60個の新しい安全マス（同階の往復は除く）。',
        ),
      }
    case 'trail-guide':
      return {
        name: t('Trail guide', '探路向导', '道案内'),
        note: t(
          'Total: 150 new safe squares visited.',
          '累计 150 个新的安全格（同层重复不计）。',
          '累計150個の新しい安全マス（同階の往復は除く）。',
        ),
      }
    case 'cache-runner':
      return {
        name: t('Cache runner', '宝箱快递员', '宝箱回収係'),
        note: t('Total: 10 chests collected.', '累计 10 个宝箱。', '累計10個の宝箱。'),
      }
    case 'cache-seeker':
      return {
        name: t('Cache seeker', '寻宝好手', '宝探し名人'),
        note: t('Total: 25 chests collected.', '累计 25 个宝箱。', '累計25個の宝箱。'),
      }
    case 'skill-student':
      return {
        name: t('Skill student', '熟能生巧', '技の修練'),
        note: t(
          'Total: 10 successful profession skills.',
          '累计 10 次成功的职业技能。',
          '累計10回の職業スキル成功。',
        ),
      }
    case 'skill-adept':
      return {
        name: t('Skill adept', '实战达人', '実戦の達人'),
        note: t(
          'Total: 25 successful profession skills.',
          '累计 25 次成功的职业技能。',
          '累計25回の職業スキル成功。',
        ),
      }
    case 'deep-route':
      return {
        name: t('Return route', '归途有记', '帰路の記録'),
        note: t('Total: 12 floors cleared.', '累计 12 层地牢。', '累計12階の突破。'),
      }
    case 'deep-descent':
      return {
        name: t('Deep descent', '向下深入', '深く潜る'),
        note: t('Total: 25 floors cleared.', '累计 25 层地牢。', '累計25階の突破。'),
      }
    case 'boss-challenger':
      return {
        name: t('Boss challenger', '迎战强敌', '強敵への挑戦'),
        note: t('Total: 3 bosses defeated.', '累计 3 个 BOSS。', '累計3体のボス討伐。'),
      }
    case 'first-victory':
      return {
        name: t('Homeward bound', '凯旋归来', '凱旋'),
        note: t('Total: 1 expedition victory.', '累计 1 次远征通关。', '累計1回の遠征クリア。'),
      }
    case 'long-road':
      return {
        name: t('Long road', '漫漫长路', '長い旅路'),
        note: t(
          'Total: 500 new safe squares visited.',
          '累计 500 个新的安全格（同层重复不计）。',
          '累計500個の新しい安全マス（同階の往復は除く）。',
        ),
      }
    case 'world-walker':
      return {
        name: t('World walker', '行遍地下', '地下を歩く者'),
        note: t(
          'Total: 1500 new safe squares visited.',
          '累计 1500 个新的安全格（同层重复不计）。',
          '累計1500個の新しい安全マス（同階の往復は除く）。',
        ),
      }
    case 'treasure-vault':
      return {
        name: t('Treasure vault', '满载而归', '宝の蔵'),
        note: t('Total: 75 chests collected.', '累计 75 个宝箱。', '累計75個の宝箱。'),
      }
    case 'treasure-legend':
      return {
        name: t('Treasure legend', '寻宝传奇', '宝探しの伝説'),
        note: t('Total: 200 chests collected.', '累计 200 个宝箱。', '累計200個の宝箱。'),
      }
    case 'skill-master':
      return {
        name: t('Skill master', '技艺精通', '技の達人'),
        note: t(
          'Total: 75 successful profession skills.',
          '累计 75 次成功的职业技能。',
          '累計75回の職業スキル成功。',
        ),
      }
    case 'skill-legend':
      return {
        name: t('Skill legend', '千锤百炼', '百戦錬磨'),
        note: t(
          'Total: 200 successful profession skills.',
          '累计 200 次成功的职业技能。',
          '累計200回の職業スキル成功。',
        ),
      }
    case 'depth-pioneer':
      return {
        name: t('Rift pioneer', '裂隙先驱', '裂け目の先駆者'),
        note: t('Total: 50 floors cleared.', '累计 50 层地牢。', '累計50階の突破。'),
      }
    case 'depth-legend':
      return {
        name: t('Depth legend', '地底传说', '地底の伝説'),
        note: t('Total: 150 floors cleared.', '累计 150 层地牢。', '累計150階の突破。'),
      }
    case 'relic-museum':
      return {
        name: t('Relic museum', '移动博物馆', '移動博物館'),
        note: t(
          'Total: 20 different relics acquired.',
          '累计 20 种实际获得的不同遗物。',
          '累計20種類の獲得した遺物。',
        ),
      }
    case 'abyss-veteran':
      return {
        name: t('Abyss veteran', '深渊常客', '深淵の熟練者'),
        note: t('Total: 5 Abyss victories.', '累计 5 次深渊难度通关。', '累計5回の深淵クリア。'),
      }
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
          'Defeat four different boss families.',
          '击败任意四种不同的首领。',
          '異なる4種類のボスを倒す。',
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
