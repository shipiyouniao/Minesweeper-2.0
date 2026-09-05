import { battleText, combatPurchaseCopy } from './combat-build-copy.js'
import { combatStats } from '../game/combat-build.js'
import { relicCopy } from './variant-copy.js'
import type { Language } from '../types/localization.js'
import type { TacticalMessages } from '../types/tactical-ui.js'
import type { EncounterKind, TacticalEncounter } from '../types/tactical.js'
import type { Expedition } from '../types/variants.js'

/** Replace only versioned combat instructions while retaining each boss's localized identity. */
export function battleCopy(
  language: Language,
  kind: EncounterKind,
  base: TacticalMessages,
): TacticalMessages {
  /** Keep every new instruction complete in all supported languages. */
  const t = (en: string, zh: string, ja: string): string => battleText(language, en, zh, ja)
  const hint =
    kind === 'bastion'
      ? t(
          'Reveal each control and flag its neighboring mines. Disable both, then prime the core and strike during its opening.',
          '揭开机关并标出周围的雷。关闭两座机关后，靠近启动核心，在破甲窗口内攻击。',
          '装置を開き周囲の地雷に旗を立てる。2基を停止し、隣接してコアを起動、露出中に攻撃。',
        )
      : t(
          'Reveal nests and flag their neighboring mines, then destroy them. Each surviving nest heals and armors the queen.',
          '揭开巢穴并标出周围的雷，再靠近摧毁。存活巢穴会持续治疗女王并提供护甲。',
          '巣を開き周囲の地雷に旗を立て、接近して破壊。残った巣は女王を回復・防護する。',
        )
  return {
    ...base,
    hint,
    danger: t('Enemy attack forecast', '敌方攻击预告', '敵の攻撃予告'),
    pylon: t(
      'Control · reveal and flag neighboring mines',
      '机关 · 揭开并标出周围地雷',
      '装置 · 開いて周囲の地雷をマーク',
    ),
    help: [
      t(
        'Base stats: 10 health, 5 attack, 0 defense and 3 AP. Your equipment and relics change these totals; the battle panel lists their sources. Move for 1 AP per cell, reveal for 1 extra, attack for 2; other actions cost 1 and flags are free.',
        '基础为 10 生命、5 攻击、0 防御、3 行动力。装备与遗物会改变这些数值，战斗面板可查看来源。移动每格 1 点，揭格另花 1 点，攻击 2 点；其他操作 1 点，插旗免费。',
        '基本は体力10・攻撃5・防御0・行動力3。装備と遺物の補正は戦闘パネルで確認。移動1マス1、開くと追加1、攻撃2、他は1。旗は無料。',
      ),
      hint,
      kind === 'bastion'
        ? t(
            'The amber control reduces future attacks from 5 to 3 damage. The blue control extends core openings to four turns. Once both are disabled, click the adjacent closed core to prime it for 1 AP. Expired openings can be primed again.',
            '琥珀机关使后续攻击从 5 降至 3 点；蓝色机关将核心窗口延长到 4 回合。两座关闭后，点击相邻的关闭核心，花 1 点启动。窗口结束后可再次启动。',
            '琥珀装置は以後の攻撃を5から3に軽減。青い装置は露出を4ターンに延長。2基停止後、隣接した閉じたコアを1行動力で起動。終了後も再起動可能。',
          )
        : t(
            'Each nest gives 3 armor and heals 3 health per turn. Destroying it stops its egg supply and deals 3 damage to the queen. Three intact nests block direct attacks. With no nests, healing stops and the queen attacks every second turn.',
            '每座巢穴提供 3 护甲，每回合治疗女王 3 点。摧毁后停止该巢补卵，并对女王造成 3 点伤害。三巢完整时无法直接攻击；全部摧毁后停止回血，女王改为每两回合攻击。',
            '巣1つにつき防護3・毎ターン体力3回復。破壊すると補充停止、女王に3ダメージ。3巣健在なら直接攻撃不可。全破壊で回復停止、女王は2ターンごとに攻撃。',
          ),
      kind === 'brood'
        ? t(
            'Eggs hatch after two turns. Hatchlings advance up to two safe cells; ghosts show committed destinations. Each hatchling deals 3 damage and the queen deals 5; overlapping attacks add together. Clear creatures to cancel their forecasts. Eggs and hatchlings total at most three.',
            '虫卵两回合孵化。幼虫最多沿安全路线前进两格，虚影显示已确定的落点。每只幼虫造成 3 点伤害，女王造成 5 点，重叠攻击会叠加。清除幼虫可取消对应预告；虫卵与幼虫总数最多 3。',
            '卵は2ターンで孵化。幼体は安全経路を最大2マス進み、残像が予定位置を示す。幼体は各3、女王は5ダメージ、重複分は加算。倒した幼体の予告は消える。卵と幼体は合計3まで。',
          )
        : t(
            'Row, column and cross attacks remain fixed until End turn. The order in which you disable the controls changes the protection and timing available during the approach.',
            '横行、纵列、十字攻击的预告在结束回合前保持不变。关闭机关的顺序会改变接近核心时可用的减伤与窗口。',
            '横列・縦列・十字の予告はターン終了まで固定。装置を止める順番で接近中の軽減と露出時間が変わる。',
          ),
      t(
        'Brace reduces this turn’s enemy damage by 3. Defense also reduces enemy damage, but a hit still deals at least 1 before shields. Mines and wrong calibrations deal 5 and ignore armor. Each shield charge absorbs up to 5. Victory fully heals and grants one shield.',
        '防御操作使本回合敌方伤害减少 3 点，护甲继续减伤；命中后至少剩 1 点，再由护盾吸收。踩雷与错误校准造成 5 点且无视护甲。每层护盾最多吸收 5 点。胜利恢复全部生命并获得 1 层护盾。',
        '防御操作は今ターンの敵ダメージを3軽減。防具も軽減するが、命中は最低1、その後シールドで吸収。地雷と調整失敗は防具を無視して5。シールド1つで最大5吸収。勝利で全回復とシールド1。',
      ),
    ],
  }
}

/** Summarize the actual remaining objectives and core window, rather than a generic boss phase. */
export function battleStatus(language: Language, encounter: TacticalEncounter): string {
  if (encounter.kind === 'brood')
    return battleText(
      language,
      `Nests ${encounter.nests.length}/3 · Armor ${encounter.nests.length * 3} · Regen ${encounter.nests.length * 3}`,
      `巢穴 ${encounter.nests.length}/3 · 护甲 ${encounter.nests.length * 3} · 每回合回血 ${encounter.nests.length * 3}`,
      `巣 ${encounter.nests.length}/3 · 防護 ${encounter.nests.length * 3} · 回復 ${encounter.nests.length * 3}`,
    )
  const active = encounter.pylons.filter((pylon) => pylon.active).length
  const window = Math.max(0, (encounter.exposedUntil ?? 0) - encounter.turn + 1)
  return active
    ? battleText(language, `Controls ${active}/2`, `机关 ${active}/2`, `装置 ${active}/2`)
    : window
      ? battleText(
          language,
          `Core open · ${window} turns`,
          `核心暴露 · 剩余 ${window} 回合`,
          `コア露出 · 残り${window}ターン`,
        )
      : battleText(
          language,
          'Approach and prime the core · 1 AP',
          '靠近并启动核心 · 1 点',
          '接近してコア起動 · 1',
        )
}

/** Show derived stats and explicit equipment/relic/training sources together. */
export function combatStatsTemplate(language: Language, run: Expedition): string {
  const stats = combatStats(run)
  const equipment = run.departure.equipment.filter(
    (item) => item !== 'probe' && item !== 'scanner' && item !== 'guard',
  )
  const sources = [
    ...equipment.map((item) => combatPurchaseCopy(language, item)),
    ...(run.departure.training ?? []).map((item) => combatPurchaseCopy(language, item)),
    ...run.relics.map((item) => relicCopy(language, item, true)),
  ]
  const entries = sources
    .map((source) => `<li><strong>${source.name}</strong> · ${source.note}</li>`)
    .join('')
  return `<div class="combat-stats"><span>${battleText(language, 'Attack', '攻击', '攻撃')} <strong>${stats.attack}</strong></span><span>${battleText(language, 'Defense', '防御', '防御')} <strong>${stats.defense}</strong></span><span>${battleText(language, 'Turn AP', '回合行动力', 'ターン行動力')} <strong>${stats.actions}</strong></span></div><details class="combat-sources"><summary>${battleText(language, 'Build effects', '配装效果', '構成の効果')}</summary><p>${battleText(language, 'Base: 5 attack · 0 defense · 3 AP', '基础：5 攻击 · 0 防御 · 3 行动力', '基本：攻撃5・防御0・行動力3')}</p>${entries ? `<ul>${entries}</ul>` : ''}</details>`
}
