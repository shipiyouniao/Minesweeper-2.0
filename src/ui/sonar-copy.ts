import type { Language } from '../types/localization.js'
import type { SonarMessages } from '../types/sonar-ui.js'

/** Keep instructional copy concise while giving the help dialog the complete rules. */
export function sonarCopy(language: Language): SonarMessages {
  /** Select authored copy without computed translation keys. */
  const t = (en: string, zh: string, ja: string): string =>
    language === 'zh' ? zh : language === 'ja' ? ja : en
  return {
    revealHint: t('Select a square to open it.', '点格子挖开。', 'マスを押して開きます。'),
    title: t('Sonar', '声呐', 'ソナー'),
    intro: t(
      'Three pulses. A little more certainty.',
      '三次回声，多一点把握。',
      '3回の反響で、確信を少しずつ。',
    ),
    scan: t('Send pulse', '声呐扫描', 'パルスを送る'),
    charges: t('Pulses left', '剩余扫描', '残りパルス'),
    history: t('Echo log', '回声记录', '反響ログ'),
    empty: t(
      'Your readings will appear here.',
      '扫描读数会留在这里。',
      'スキャン結果がここに残ります。',
    ),
    opening: t('Open a square to start.', '先挖开一格。', 'まずマスを開きましょう。'),
    aim: t(
      'Choose the center of a 3 × 3 region. Esc cancels.',
      '选择 3 × 3 区域的中心，Esc 取消。',
      '3 × 3 範囲の中心を選択。Escで取消。',
    ),
    duplicate: t(
      'Already scanned · reading selected',
      '已扫描，已选中这份读数',
      'スキャン済みの結果を選択しました',
    ),
    exhausted: t('All three pulses used.', '三次扫描已用完。', '3回のパルスを使い切りました。'),
    comparison: t('Compare echoes', '对照回声', '反響を比較'),
    compareHint: t(
      'Select two readings to compare their regions.',
      '选中两份读数，对照各自的范围。',
      '2つの結果を選び、範囲を比べます。',
    ),
    exclusive: t('Exclusive region', '独有区域', '固有範囲'),
    shared: t('Shared squares', '重叠格数', '重なるマス'),
    difference: t(
      'Mine difference outside the overlap',
      '去掉重叠部分后的雷数差',
      '重なりを除いた地雷数の差',
    ),
    moves: t('Moves', '操作数', '操作数'),
    scans: t('Pulses used', '扫描次数', '使用パルス'),
    reading: t('Echo', '回声', '反響'),
    mines: t('mines', '颗雷', '個の地雷'),
    help: t('How to play', '怎么玩', '遊び方'),
    rankHint: t(
      'Fewest moves first; fewer pulses break ties.',
      '操作数越少越靠前，同分时比较扫描次数。',
      '操作数が少ない順。同数ならパルスの少ない順。',
    ),
    noRecords: t(
      'Your first clear belongs here.',
      '等待你的第一次通关。',
      '最初のクリアを待っています。',
    ),
    recovered: t(
      'The saved puzzle could not be restored. Your valid records were kept.',
      '这张旧棋盘无法恢复，已保留有效纪录。',
      '保存した盤面を復元できませんでした。有効な記録は残っています。',
    ),
    limit: t(
      'This puzzle reached its move limit. Start a new board.',
      '本局操作已达上限，请开始新棋盘。',
      '操作上限に達しました。新しい盤面を始めてください。',
    ),
    zoom: t('Enlarge squares', '放大格子', 'マスを拡大'),
    fit: t('Fit board', '适应宽度', '幅に合わせる'),
    win: t(
      'Every echo, accounted for.',
      '回声落定，雷区已清。',
      'すべての反響を解き明かしました。',
    ),
    loss: t('One echo left unanswered.', '还有一处回声未解。', 'ひとつの反響が残りました。'),
    target: t('Scan target', '扫描目标', 'スキャン対象'),
    helpSteps: [
      {
        title: t('Open the board', '打开棋盘', '盤面を開く'),
        note: t(
          'The first opening and its neighbors are safe. Reveal every safe square to win.',
          '第一格及相邻区域安全。挖开所有安全格即可获胜。',
          '最初のマスと周囲は安全です。安全なマスをすべて開くと勝利です。',
        ),
      },
      {
        title: t('Spend a pulse', '发出回声', 'パルスを送る'),
        note: t(
          'Choose Send pulse, then a center square. The clipped 3 × 3 region reports its total mines, including flags. Mines stay fixed; their individual locations remain hidden.',
          '点击声呐扫描，再选择中心格。读数统计周围 3 × 3 范围的全部地雷，边缘处按实际格数计算。地雷位置不会改变，也不会逐格揭示。',
          'パルスを選び、中心マスを押します。端で切り取った3 × 3範囲の地雷総数です。旗も含みますが、地雷の個々の位置は示しません。',
        ),
      },
      {
        title: t('Compare two echoes', '对照两次回声', '2つの反響を比べる'),
        note: t(
          'Select two log entries. Their shared squares cancel: the difference between totals equals the difference between their exclusive regions. Flags remain your own guesses.',
          '选中两份记录，重叠部分在相减时抵消。两份总数的差，就是各自独有区域的雷数差。普通旗帜仍是自己的判断。',
          'ログを2つ選びます。共通部分を相殺すると、総数の差は固有範囲の地雷数の差になります。旗は自分の推測のままです。',
        ),
      },
      {
        title: t('Make each pulse count', '把回声用在关键处', 'パルスを大切に'),
        note: t(
          'Three pulses per board. Selecting a previous center recalls its reading for free. Q aims; Enter/Space scans; Esc cancels. F flags, S notes safety, C quick-opens; right-click or hold cycles marks. A scan counts separately from board moves.',
          '每张棋盘可扫描三次，重复选取同一中心只调出旧读数。Q 瞄准，Enter / 空格扫描，Esc 取消；F 插旗，S 标记疑似安全，C 快速开格，右键或长按循环标记。扫描次数与棋盘操作数分开记录。',
          '1盤面に3回。同じ中心は無料で結果を再表示。Qで照準、Enter/Spaceで実行、Escで取消。Fで旗、Sで安全メモ、Cで周囲を開き、右クリックや長押しで印を切替。パルスと盤面操作は別々に数えます。',
        ),
      },
    ],
  }
}
