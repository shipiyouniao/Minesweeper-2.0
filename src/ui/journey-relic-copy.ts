import type { Language } from '../types/localization.js'
import type { JourneyPack, JourneyRelic } from '../types/relic-packs.js'
import type { VariantDescription } from '../types/variant-ui.js'

/** Keep names, usable conditions and charge limits together in each supported language. */
function localized(
  language: Language,
  en: string,
  zh: string,
  ja: string,
  enNote: string,
  zhNote: string,
  jaNote: string,
): VariantDescription {
  if (language === 'zh') return { name: zh, note: zhNote }
  if (language === 'ja') return { name: ja, note: jaNote }
  return { name: en, note: enNote }
}

/** Describe the twelve exploration and tactical effects at the point of selection. */
export function journeyRelicCopy(language: Language, relic: JourneyRelic): VariantDescription {
  switch (relic) {
    case 'trail-thread':
      return localized(
        language,
        'Trail thread',
        '路标线',
        '道しるべの糸',
        'Visit 12 new safe squares to gain 1 scan. Once per floor; cap 4. Backtracking does not count.',
        '每层走过 12 个新的安全格，补充 1 次扫描，上限 4。重复走过不计数。',
        '各階で新しい安全マスを12個歩くと走査+1、上限4。同じマスは数えない。',
      )
    case 'landmark-lens':
      return localized(
        language,
        'Landmark lens',
        '地标透镜',
        '目印のレンズ',
        'The first chest collected each floor surveys the 3×3 area around that chest.',
        '每层收集的第一个宝箱会侦察其周围 3×3 区域。',
        '各階で最初に回収した宝箱の周囲3×3を調査する。',
      )
    case 'probe-recycler':
      return localized(
        language,
        'Probe recycler',
        '探针回收器',
        '探針回収器',
        'Refund the first probe each floor that reveals new information but confirms no new mines.',
        '每层首次探针获得新信息但未新确认雷时，返还该探针。',
        '各階で初めて、新情報を得ても新たな地雷を確定しなかった探針を返却。',
      )
    case 'spare-coil':
      return localized(
        language,
        'Spare coil',
        '备用线圈',
        '予備コイル',
        'A row scan confirming at least 2 new mines grants 1 probe. Once per floor; cap 4.',
        '整行扫描新确认至少 2 颗雷后，补充 1 根探针。每层一次，上限 4。',
        '行走査で新たに地雷を2個以上確定すると探針+1。各階1回、上限4。',
      )
    case 'skill-capacitor':
      return localized(
        language,
        'Skill capacitor',
        '技能蓄能器',
        'スキル蓄電器',
        'Using your profession skill grants 1 scan. Once per floor; cap 4.',
        '使用职业技能后补充 1 次扫描。每层一次，上限 4。',
        '職業スキル使用後に走査+1。各階1回、上限4。',
      )
    case 'emergency-gears':
      return localized(
        language,
        'Emergency gears',
        '应急齿轮',
        '応急歯車',
        'Use a row scan while out of probes to gain 2 probes. Once per floor; cap 4.',
        '没有探针时使用整行扫描，补充 2 根探针。每层一次，上限 4。',
        '探針が0の時に行走査を使うと探針+2。各階1回、上限4。',
      )
    case 'marching-boots':
      return localized(
        language,
        'Marching boots',
        '行军靴',
        '行軍靴',
        'In combat, your first walk of 2 or more steps each turn costs 1 less AP. Minimum cost 1; reveals excluded.',
        '战斗中，每回合首次移动至少 2 格时少花 1 点行动点，最低消耗 1 点。不影响揭格。',
        '戦闘中、各ターン最初の2歩以上の移動は行動力を1節約。最低1、マスを開く行動は対象外。',
      )
    case 'shelter-cloak':
      return localized(
        language,
        'Shelter cloak',
        '避风斗篷',
        '避難の外套',
        'End a combat turn outside the warning area to gain 1 shield. Once per floor; cap 2.',
        '战斗中，在预警区外结束回合可获得 1 层护盾。每层一次，上限 2。',
        '戦闘で予告範囲外でターンを終えるとシールド+1。各階1回、上限2。',
      )
    case 'breach-sigil':
      return localized(
        language,
        'Breach sigil',
        '破阵印记',
        '破陣の印',
        'Your first successful pylon calibration each floor returns 1 AP. AP cap 4.',
        '每层首次成功关闭护盾塔后返还 1 点行动点，行动点上限 4。',
        '各階で初めて防護塔を停止すると行動力+1。上限4。',
      )
    case 'duelist-edge':
      return localized(
        language,
        'Duelist edge',
        '决斗锋刃',
        '決闘の刃',
        'Your first strike each floor deals 2 extra damage. Active pylons still block attacks.',
        '每层首次攻击额外造成 2 点伤害。护盾塔未全部关闭时仍无法攻击。',
        '各階で最初の攻撃はダメージ+2。防護塔が残っている間は攻撃できない。',
      )
    case 'reserve-watch':
      return localized(
        language,
        'Reserve watch',
        '储时怀表',
        '蓄時の懐中時計',
        'End a combat turn with unused AP to start the next with 4 AP. Once per floor.',
        '战斗中，保留行动点结束回合后，下回合以 4 点行动点开始。每层一次。',
        '戦闘で行動力を残してターンを終えると、次は行動力4で開始。各階1回。',
      )
    case 'second-hand':
      return localized(
        language,
        'Second hand',
        '回响秒针',
        '反響の秒針',
        'After surviving the third combat turn, gain 1 probe and 1 scan. Once per floor; cap 4 each.',
        '存活至战斗第三回合结束，补充 1 根探针和 1 次扫描。每层一次，各自上限 4。',
        '戦闘の第3ターン終了まで生存すると探針と走査を各+1。各階1回、それぞれ上限4。',
      )
  }
}

/** Explain what each permanent license adds to future reward choices. */
export function journeyPackCopy(language: Language, pack: JourneyPack): VariantDescription {
  switch (pack) {
    case 'cartographer-charts':
      return localized(
        language,
        'Cartographer charts',
        '制图图册包',
        '製図図録パック',
        'Add Trail thread and Landmark lens: earn scans by travelling and survey around collected chests.',
        '将路标线、地标透镜加入遗物池：走路补充扫描，宝箱侦察周边。',
        '道しるべの糸と目印のレンズを追加。移動で走査を補充し、宝箱の周囲を調査。',
      )
    case 'salvager-kit':
      return localized(
        language,
        'Salvager kit',
        '回收工具包',
        '回収道具パック',
        'Add Probe recycler and Spare coil: recover probes from careful surveying and productive row scans.',
        '将探针回收器、备用线圈加入遗物池：回收探针，让整行扫描补充工具。',
        '探針回収器と予備コイルを追加。調査から探針を回収し、行走査で道具を補充。',
      )
    case 'mechanist-gears':
      return localized(
        language,
        'Mechanist gears',
        '机巧齿轮包',
        '機巧歯車パック',
        'Add Skill capacitor and Emergency gears: link career skills with scans and rebuild empty probe stocks.',
        '将技能蓄能器、应急齿轮加入遗物池：技能补充扫描，扫描补充耗尽的探针。',
        'スキル蓄電器と応急歯車を追加。スキルで走査を補充し、探針切れから立て直す。',
      )
    case 'wayfarer-tokens':
      return localized(
        language,
        'Wayfarer tokens',
        '旅者信物包',
        '旅人の証パック',
        'Add Marching boots and Shelter cloak: cheaper combat movement and protection for avoiding warnings.',
        '将行军靴、避风斗篷加入遗物池：节省战斗移动点数，避开预警获得护盾。',
        '行軍靴と避難の外套を追加。戦闘移動を節約し、予告回避で防護を獲得。',
      )
    case 'duelist-marks':
      return localized(
        language,
        'Duelist marks',
        '决斗徽记包',
        '決闘紋章パック',
        'Add Breach sigil and Duelist edge: recover AP when breaking defenses and strengthen the opening strike.',
        '将破阵印记、决斗锋刃加入遗物池：破盾返还行动点，强化首次攻击。',
        '破陣の印と決闘の刃を追加。防護解除で行動力を回収し、初撃を強化。',
      )
    case 'chronologist-dials':
      return localized(
        language,
        'Chronologist dials',
        '时序刻盘包',
        '時序文字盤パック',
        'Add Reserve watch and Second hand: bank a turn of spare effort and recover tools during longer battles.',
        '将储时怀表、回响秒针加入遗物池：留存一次回合余力，持久战补充道具。',
        '蓄時の懐中時計と反響の秒針を追加。余力を次へ回し、長期戦で道具を補充。',
      )
  }
}
