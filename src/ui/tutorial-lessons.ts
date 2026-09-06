import { battleText } from './combat-build-copy.js'
import type { Language } from '../types/localization.js'
import type { Ruleset } from '../types/variants.js'
import type { TutorialDefinition, TutorialStep } from '../types/guidance.js'

/** Lessons teach one ruleset on deterministic practice boards, never a live saved run. */
export function tutorialLesson(mode: Ruleset, language: Language): TutorialDefinition {
  const t = (en: string, zh: string, ja: string): string => battleText(language, en, zh, ja)
  const cell = (
    title: string,
    text: string,
    index: number,
    side: 'a' | 'b' = 'a',
    mode: TutorialStep['mode'] = 'reveal',
  ): TutorialStep => ({ title, text, action: 'cell', index, side, mode })
  const first = cell(
    t('A quiet first step', '先翻开一小片土地', '最初の一歩'),
    t(
      'Open the glowing square. Empty ground opens its connected blank area; numbers stop the expansion.',
      '点一下发光的格子。空白会连成一片打开，遇到数字便停下。',
      '光るマスを開きましょう。空白はつながって開き、数字で止まります。',
    ),
    0,
  )
  const number: TutorialStep = {
    title: t('Read the neighborhood', '数字说的是周围八格', '数字は周囲8マス'),
    text: t(
      'Select this 1 to inspect its eight neighbors. Only the covered square to the right remains unknown, so that square must contain the one mine.',
      '点一下这个「1」，看看它周围的八个位置。除了右边那个未开格，其他邻格已经安全，因此那一格就是这颗雷。',
      'この「1」を選び、周囲8マスを確認。右の未開封マス以外は安全なので、そこに1個の地雷があります。',
    ),
    action: 'inspect',
    index: 3,
    side: 'a',
  }
  const flagMode: TutorialStep = {
    title: t('One button, four actions', '一个按钮，切换操作', 'ボタン1つで操作切替'),
    text: t(
      'Press the action button once to select Flag. Mouse users can also right-click a square; touch users can hold it. Keyboard users can focus a square and press F.',
      '点一下操作按钮，切换到「插旗」。电脑也可以直接右键格子；触屏可以长按；键盘把焦点移到格子后按 F。',
      '操作ボタンを1回押して旗へ。マウスは右クリック、タッチは長押し、キーボードはマスに移動してFでも操作できます。',
    ),
    action: 'mode',
    index: -1,
    side: 'a',
    mode: 'flag',
  }
  const flag = cell(
    t('Leave a reliable mark', '把推理结果记下来', '推理を旗に残す'),
    t(
      'Flag the glowing covered square. A flag is your note, not a mine detector: place it because the number proves it.',
      '给发光的未开格插旗。旗子只是你留下的判断，不会替你探雷；这一次，我们是根据数字才确认它的。',
      '光る未開封マスに旗を立てましょう。旗は探知機ではなく自分のメモ。今回は数字を根拠に判断しました。',
    ),
    4,
    'a',
    'flag',
  )
  if (mode === 'classic')
    return {
      mode,
      title: t('Classic · first field', '标准扫雷 · 第一片雷区', 'クラシック · 最初の盤面'),
      steps: [
        first,
        number,
        flagMode,
        flag,
        cell(
          t('Make a second deduction', '再推理一次', 'もう一度推理'),
          t(
            'The revealed 1 diagonally above-right of this square has only this covered neighbor. Flag it too. You can take as long as you need; speed comes after certainty.',
            '这个格子右上方的「1」，只剩它一个未知邻格。再标出这一颗雷。不用赶时间，先把判断做准确。',
            'このマスの右上の「1」には、未確認の隣接マスがこれだけ。ここにも旗を。急がず確実に判断しましょう。',
          ),
          16,
          'a',
          'flag',
        ),
        {
          title: t('Open a safe neighborhood', '一次翻开周围', '周囲をまとめて開く'),
          text: t(
            'Cycle to Quick open. You will pass Safe note: that marks a guess about safety, not a guarantee. Quick open uses a number with matching flags to open its other neighbors.',
            '继续点击切换按钮，直到「快速开格」。中间的「标安全」只记录你的猜测。快速开格会在旗数与数字一致时，打开剩余邻格。',
            '操作を「周囲を開く」まで切り替えます。途中の安全メモは推測です。周囲を開く操作は、数字と旗数が一致すると残りの隣接マスを開きます。',
          ),
          action: 'mode',
          index: -1,
          side: 'a',
          mode: 'chord',
        },
        cell(
          t('Open the route', '先打开通路', '道を開く'),
          t(
            'Quick open this 1. Its flagged neighbor accounts for the mine, so the covered square below can be opened safely.',
            '快速翻开这个「1」周围的格子。旁边的旗已经对应了那颗雷，下面的未开格就可以安全打开。',
            'この「1」で周囲を開きます。隣の旗が地雷1個を示すので、下の未開封マスは安全です。',
          ),
          11,
          'a',
          'chord',
        ),
        cell(
          t('Finish with confidence', '最后一步，交给推理', '確信を持って最後の一手'),
          t(
            'Use Quick open on this 1. Its mine is flagged, so the remaining covered neighbors are safe. Winning means opening every safe square; flagging every mine is not required.',
            '在发光的「1」上使用快速开格。它旁边的雷已标出，剩下的邻格就安全了。翻开全部安全格即获胜，不要求给每颗雷都插旗。',
            '光る「1」で周囲を開きましょう。隣の地雷には旗があるので、残りは安全。すべての安全マスを開けば勝利です。',
          ),
          15,
          'a',
          'chord',
        ),
      ],
      ending: t(
        'You read clues, marked mines and opened a whole neighborhood. In a real game a wrong flag can make quick opening dangerous. Pause and inspect the numbers whenever you are unsure.',
        '你已经完成了读数字、插旗和快速开格。正式对局中，错旗会让快速开格变得危险。拿不准时，停下来重新检查数字。',
        '数字を読み、旗を立て、周囲を開けました。本番では誤った旗が危険につながります。迷ったら数字を確認しましょう。',
      ),
    }
  if (mode === 'twin')
    return {
      mode,
      title: t(
        'Twin · two sides of a clue',
        '双生扫雷 · 同一坐标的另一面',
        '双生 · 同じ座標の向こう側',
      ),
      steps: [
        first,
        number,
        flagMode,
        flag,
        {
          title: t('Bring the discovery across', '把发现带到另一块棋盘', '発見を向こう側へ'),
          text: t(
            'The two boards never have mines at the same coordinate. The mine you proved on A makes that coordinate safe on B. Cycle back to Reveal.',
            '两块棋盘的同一个坐标，不会同时埋雷。你在 A 盘确认的雷，意味着 B 盘同一位置一定安全。先把操作切回「翻开」。',
            '同じ座標に両方の地雷はありません。Aで確定した地雷の位置は、Bでは必ず安全。操作を「開く」に戻しましょう。',
          ),
          action: 'mode',
          index: -1,
          side: 'b',
          mode: 'reveal',
        },
        cell(
          t('Test the other side', '亲手验证另一面', '向こう側で確かめる'),
          t(
            'Open the matching glowing square on B. The link transfers a deduction, not the numbers: each board still counts only its own mines.',
            '翻开 B 盘上对应的发光格。传递过去的是推理，不是数字；每块棋盘的数字仍只统计自己周围的雷。',
            'Bの同じ光るマスを開きます。共有するのは推理であって数字ではありません。各盤面の数字は自分の地雷だけを数えます。',
          ),
          4,
          'b',
        ),
        {
          title: t('Keep both boards in view', '两边都要照顾到', '両方を見渡す'),
          text: t(
            'Select the matching flag on A once more. The coordinate highlight links the two sides. Clear all safe squares on both boards to win; a mine hit on either ends the pair.',
            '再点一下 A 盘那面旗，看看两边对应位置的高亮。两块棋盘的安全格都翻完才算胜利；任意一边踩雷，这一局都会结束。',
            'Aの旗をもう一度選び、両盤面の対応位置を確認。両方の安全マスを全部開くと勝利、どちらかで地雷を踏むと終了です。',
          ),
          action: 'inspect',
          index: 4,
          side: 'a',
        },
      ],
      ending: t(
        'Alternate between local clues and proven mines on the other board. Flags are still hypotheses until the visible clues justify them.',
        '局部数字与另一盘确认的雷，可以交替提供线索。记住：未经数字验证的旗子，仍然只是猜测。',
        '手元の数字と反対側の確定地雷を行き来しましょう。根拠のない旗はあくまで推測です。',
      ),
    }
  return {
    mode,
    title: t('Expedition · leave camp', '远征 · 第一次出发', '遠征 · 最初の出発'),
    steps: [
      cell(
        t('You are on the board', '这一次，你也在棋盘上', '盤面に自分がいる'),
        t(
          'Move to the glowing open square. Your explorer walks along known safe ground. Ordinary floors have no turn timer or action-point cost.',
          '点击发光的已开格，走过去。角色只能沿已知安全路线移动。普通楼层没有回合倒计时，也不消耗行动点。',
          '光る開いたマスへ移動。探検家は既知の安全な道を歩きます。通常階にターン制限や行動力消費はありません。',
        ),
        7,
      ),
      cell(
        t('Explore from your route', '沿着已知路线开路', '道から探索を広げる'),
        t(
          'Reveal this frontier square. Your explorer first approaches it by a safe route, then digs. Distant covered cells need a reachable neighboring square.',
          '翻开发光的边界格。角色会先沿安全路线靠近，再挖开它。远处的未开格，必须先有一条能走到它邻边的路。',
          '境界の光るマスを開きます。安全な道で近づいてから掘ります。遠い未開封マスには隣まで行ける道が必要です。',
        ),
        15,
      ),
      {
        title: t('Your profession has a skill', '试试职业技能', '職業スキルを使う'),
        text: t(
          'Use Explorer’s light. It surveys the nearby 3×3 area once per floor. Confirmed mines stay locked; confirmed safe squares still need to be opened. Your skill lives in the bottom dock.',
          '使用探路灯，侦察身边的 3×3 区域，每层只能完成一次。确认的雷会锁定标记；确认安全的格子仍需要亲手翻开。职业技能就在底部技能栏里。',
          '探検家の灯りで周囲3×3を調査。各階1回です。確定地雷は固定表示、安全と分かったマスも自分で開きます。スキルは下のバーにあります。',
        ),
        action: 'skill',
        index: -1,
        side: 'a',
      },
      {
        title: t('A probe looks ahead', '探针替你先看一眼', '探針で先を調べる'),
        text: t(
          'Select the probe, then the glowing square. It surveys a chosen 3×3 area without moving you. A rejected or redundant target does not spend a charge.',
          '先选择探针，再点发光格。探针能侦察指定位置的 3×3 区域，不会把角色送过去。无效或重复的目标不会扣次数。',
          '探針を選び、光るマスを押します。指定した3×3を移動せず調査。無効・重複の対象では回数を消費しません。',
        ),
        action: 'probe',
        index: 4,
        side: 'a',
      },
      {
        title: t('Survey a whole row', '扫描一整行', '一列を調査する'),
        text: t(
          'Select the scanner, then any glowing square on the last row. It identifies the row’s mines and safe ground. Both tools show their remaining charges in the dock.',
          '选择扫描器，再点最后一行的发光格。它会确认这一行的雷与安全位置。两件道具的剩余次数，都会显示在技能栏上。',
          '走査器を選んで最下段の光るマスを押すと、その行の地雷と安全を確認。道具の残り回数はバーに表示されます。',
        ),
        action: 'scan',
        index: 22,
        side: 'a',
      },
      cell(
        t('Reach the treasure', '宝箱要走过去才能拿到', '宝箱まで歩く'),
        t(
          'Walk to the glowing chest to collect it. Revealing a chest is not the same as picking it up. Relics you later acquire are kept in the expandable collection menu.',
          '走到发光的宝箱上领取它。看见宝箱不等于已经拿到；之后获得的遗物，会收在可以展开的遗物菜单里。',
          '光る宝箱まで歩いて回収。見つけただけでは入手できません。後で手に入る遺物は開閉できる一覧に入ります。',
        ),
        13,
      ),
      cell(
        t('Choose when to descend', '准备好了，再下楼', '準備ができたら次の階へ'),
        t(
          'Select the stairs deliberately to leave the floor. Health carries between floors: a mine deals 5 damage, a shield absorbs up to 5. Boss floors use action points; their arrivals offer clues to their character.',
          '确认准备好后，主动点击楼梯离开。生命会跨层保留：踩雷伤害为 5，一层护盾最多挡 5。BOSS 房才使用行动点，开场时可以留意它们的言行。',
          '準備ができたら階段を選びます。体力は次の階へ持ち越し、地雷は5ダメージ、盾1枚は最大5吸収。ボス部屋では行動力を使い、登場時の言動が手がかりになります。',
        ),
        24,
      ),
    ],
    ending: t(
      'You can move, scout, collect and descend. In real expeditions, choose a relic after cleared floors, watch your health and return to camp when you need to.',
      '现在你会移动、侦察、收集和下楼了。正式远征中，清层后选择遗物，留意生命，也可以选择撤退回营。',
      '移動、調査、回収、階段を練習できました。本番は階層クリア後に遺物を選び、体力に注意し、必要なら帰還しましょう。',
    ),
  }
}
