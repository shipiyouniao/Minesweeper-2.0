import type { VariantDifficulty } from '../types/variant-difficulty.js'
import type { Language } from '../types/localization.js'
import type { Equipment, Profession, Relic, Upgrade } from '../types/variants.js'
import type { VariantDescription, VariantMessages } from '../types/variant-ui.js'

/** Require all three translations at each catalog entry, with no computed translation keys. */
function localized(language: Language, en: string, zh: string, ja: string): string {
  return language === 'zh' ? zh : language === 'ja' ? ja : en
}

/** Supply complete, explicit labels for the special-mode UI. */
export function variantCopy(language: Language): VariantMessages {
  /** Bind the current locale while retaining all three required source strings. */
  const t = (en: string, zh: string, ja: string): string => localized(language, en, zh, ja)
  return {
    difficulty: t('Difficulty', '难度', '難易度'),
    legacyDifficulty: t('Original rules', '原版规则', '旧ルール'),
    nextFloor: t('Continue to next floor', '进入下一层', '次の階へ'),
    zoom: t('Larger cells', '放大格子', 'マスを拡大'),
    fit: t('Fit board', '适应面板', '盤面を全体表示'),
    zoomHint: t(
      'Scroll or swipe to explore the enlarged board.',
      '滚动或滑动查看放大的棋盘。',
      'スクロールやスワイプで拡大した盤面を移動。',
    ),
    confirmedMine: t(
      'Confirmed mine · locked flag',
      '确认有雷 · 标记已锁定',
      '地雷確定 · 旗を固定',
    ),
    confirmedSafe: t('Confirmed safe', '已确认安全', '安全確認済み'),
    probeResult: t(
      'Probe found {count} mines.',
      '探测发现 {count} 枚雷。',
      '探査で地雷{count}個を発見。',
    ),
    rowMines: t('mines total', '地雷总数', '地雷合計'),
    controls: t(
      'Arrows / Home / End: move focus. Enter / Space: reveal. F or right-click: flag. On touch, choose Reveal or Flag before tapping a cell.',
      '方向键 / Home / End 移动光标；Enter / 空格翻开；F 或右键插旗。触屏先选择翻开或插旗，再点击格子。',
      '矢印 / Home / End で移動、Enter / Space で開く、F または右クリックで旗。タッチでは開く・旗を選んでからマスをタップ。',
    ),
    modes: t('Game mode', '玩法模式', 'ゲームモード'),
    classic: t('Classic', '标准扫雷', 'クラシック'),
    expedition: t('Expedition', '远征', '遠征'),
    twin: t('Twin boards', '双生棋盘', '双子盤'),
    camp: t('Base camp', '营地', 'キャンプ'),
    supplies: t('Supplies', '物资', '物資'),
    departures: t('Completed expeditions', '远征通关', '遠征クリア'),
    start: t('Begin expedition', '出发远征', '遠征開始'),
    profession: t('Profession', '职业', '職業'),
    equipment: t('Loadout · 3 points', '出发装备 · 3 点预算', '装備 · 3 ポイント'),
    campGoal: t('Next camp upgrade', '下一项营地建设', '次のキャンプ強化'),
    campEarly: t('Early choices', '入门选择', '序盤の選択肢'),
    campMiddle: t('Middle milestone', '中期建设', '中盤の目標'),
    campLate: t('Long-term goal', '长期目标', '長期目標'),
    campRemaining: t('{count} still needed', '还差 {count}', 'あと{count}'),
    campMinimumRuns: t(
      'At least {count} more runs · theoretical maximum {maximum} supplies per run.',
      '至少还需 {count} 局 · 单局理论上限 {maximum} 物资。',
      '最低あと{count}回 · 1回の理論上限は物資{maximum}。',
    ),
    campAffordable: t('Ready to unlock below.', '已攒够，可在下方解锁。', '下から解放できます。'),
    campComplete: t(
      'All camp facilities unlocked.',
      '营地设施已全部解锁。',
      'キャンプ施設を全て解放済み。',
    ),
    facilities: t('Camp facilities', '营地建设', 'キャンプ施設'),
    owned: t('Unlocked', '已解锁', '解放済み'),
    locked: t('Unlock at camp', '需要营地解锁', 'キャンプで解放'),
    floor: t('Floor', '层数', '階層'),
    loot: t('Run loot', '本局战利品', '戦利品'),
    probes: t('Probes', '探针', '探針'),
    scans: t('Scans', '扫描', '走査'),
    health: t('Health', '生命', '体力'),
    healthHint: t(
      'Mines cost 1 HP. Shields absorb first. Reach the exit to recover 1 HP.',
      '踩雷扣 1 点生命，护盾优先抵挡；抵达出口恢复 1 点生命。',
      '地雷で体力−1。シールドが優先して防御。出口で体力+1。',
    ),
    healthHelp: t(
      'Start with 2 HP. Mines deal 1 damage, consuming a shield first. At zero HP the expedition ends. Reaching each exit restores 1 HP, up to your maximum. Survived mines receive locked gold flags and remain impassable. Health and up to 2 shields carry between floors.',
      '初始 2 点生命。踩雷受到 1 点伤害，优先消耗护盾；生命归零则远征结束。每层抵达出口恢复 1 点生命，不超过上限。存活后踩中的雷会标上锁定金旗，无法通行。生命与护盾跨层保留，护盾上限 2。',
      '初期体力は2。地雷で1ダメージ、シールドを先に消費し、体力0で遠征終了。各階の出口で体力が1回復し、上限は超えません。生き残ると地雷は固定の金の旗になり通行不可。体力とシールドは次の階へ引き継ぎ、シールド上限は2。',
    ),
    legacyHealth: t(
      'Saved run: one unshielded mine ends the expedition. No exit healing.',
      '此存档沿用旧规则：无护盾踩雷即结束，出口不回血。',
      '旧保存ルール：シールドなしで地雷を踏むと終了。出口での回復なし。',
    ),
    shields: t('Shields', '护盾', 'シールド'),
    probe: t('Probe 3×3 area', '探测 3×3 区域', '3×3範囲を探査'),
    scan: t('Scan a row', '扫描一行', '行を走査'),
    wall: t('Wall · impassable', '墙壁 · 无法通行', '壁 · 通行不可'),
    player: t('Explorer', '探险者', '探検家'),
    migrated: t(
      'Camp and results preserved. The previous dungeon run was retired after the map update.',
      '营地成长与成绩已保留；地图更新后，旧版未完成远征已返回营地。',
      'キャンプと記録は保持しました。マップ更新により旧遠征は終了しました。',
    ),
    retreat: t('Extract to camp', '撤离回营地', 'キャンプへ帰還'),
    retreatNote: t(
      'End this expedition and bank all collected loot?',
      '结束本次远征，带回全部已收集战利品？',
      '遠征を終了し、集めた戦利品を持ち帰りますか？',
    ),
    reward: t(
      'Choose one relic for the next floor',
      '选择一件遗物，进入下一层',
      '遺物を1つ選んで次の階へ',
    ),
    exit: t('Exit', '出口', '出口'),
    entrance: t('Entrance', '入口', '入口'),
    treasure: t('Treasure · safe', '宝箱 · 安全格', '宝箱 · 安全'),
    collected: t('Collected', '已收集', '回収済み'),
    frontier: t('Reachable frontier', '可探索前沿', '探索可能な境界'),
    relics: t('Relic build', '遗物搭配', '遺物構成'),
    noRelics: t(
      'Find your first relic after floor one.',
      '通过第一层后获得首件遗物。',
      '第1階層を突破して遺物を入手。',
    ),
    earned: t('Banked supplies', '带回物资', '獲得物資'),
    won: t('Expedition complete', '远征通关', '遠征クリア'),
    lost: t('Expedition ended', '远征失败', '遠征失敗'),
    retreated: t('Safely extracted', '成功撤离', '帰還成功'),
    steps: t('Moves', '操作数', '手数'),
    records: t('Recent results · this mode', '近期记录 · 当前模式', '最近の結果 · このモード'),
    noRecords: t('Your story starts here.', '从这里写下第一段旅程。', 'ここから冒険が始まる。'),
    expeditionHelp: t(
      'Click revealed floor to walk there along the shortest known safe route. Click a highlighted frontier cell to approach and reveal it. Visit treasure chests to collect them. Click the stairs to walk to the next floor entrance; reaching them opens the relic choice. All safe floor is connected; unreachable pockets become walls. Movement uses four directions, while clues count eight neighbors. Blue flags are guesses. Gold flags are confirmed mines and cannot be removed. Each floor chooses an interior entrance, with a small irregular opening and useful clues.',
      '点击已揭示地板，角色沿已知安全路线自动寻路；点击高亮前沿，会先走近再探索。走到宝箱才能收取奖励。点击楼梯并抵达后，选择遗物进入下一层。所有安全地板上下左右连通，孤立区域会成为墙壁；数字仍统计周围八格。蓝旗是手动猜测，金旗是已确认的雷，无法取消。每层从变化的内圈入口出发，开局是带有效线索的小型不规则区域。',
      '開いた床をクリックすると既知の安全な最短経路を歩きます。境界をクリックすると近づいて探索します。宝箱は訪れて回収。階段へ歩いて到着すると遺物を選び次の階へ。安全な床は上下左右につながり、孤立した場所は壁になります。数字は周囲8マスを数え、青い旗は推測、金の旗は確定地雷で解除不可。階ごとに内側の入口が変わり、小さな不規則な領域と有効な数字で始まります。',
    ),
    twinHelp: t(
      'At each coordinate, at most one board has a mine. A mine you deduce on A guarantees safety on B, but two safe cells are also possible. Flags never prove safety. Clear every safe cell on both boards; hitting a mine on either ends the pair. The first reveal opens a safe neighborhood on both.',
      '同一坐标最多只有一张棋盘有雷。在 A 盘推理确认有雷，就能确定 B 盘对应格安全；两边都安全也可能。插旗不等于证明。翻开两盘所有安全格获胜，任一盘踩雷整局结束。首次翻开会同时打开两盘的安全邻域。',
      '同じ座標に地雷があるのは最大で片方のみ。A の地雷を推理できれば B の同じマスは安全ですが、両方安全な場合もあります。旗は証明ではありません。両盤の安全マスを全て開けば勝利、片方で踏めば終了。初手は両盤で安全な領域が開きます。',
    ),
    campHelp: t(
      'Choose your difficulty and expedition length. Build a relic collection along the way. Bank all loot on extraction, half on defeat, and a completion bonus on victory. Unlock careers and a three-point equipment loadout with supplies. Growth opens choices; mines remain dangerous.',
      '选择难度与远征层数，遗物逐层成型。撤离带回全部战利品，失败保留一半，通关另有奖励。用物资解锁职业与三点预算的初始装备。成长增加策略选择，地雷仍然危险。',
      '難易度と階層数を選び、遺物構成を育てます。帰還で全戦利品、敗北で半分、クリアで追加報酬。物資で職業と3ポイントの初期装備を解放。成長は選択肢を増やし、地雷の危険は残ります。',
    ),
    ready: t(
      'Choose the first opening on either board.',
      '在任一棋盘选择首次翻开的位置。',
      'どちらかの盤で初手を選びましょう。',
    ),
    exploring: t(
      'Find a safe route to the exit.',
      '推理出通往出口的安全路线。',
      '出口への安全な道を探しましょう。',
    ),
    exitReady: t(
      'Stairs reachable · click them when ready to leave.',
      '楼梯已连通 · 准备好后点击楼梯前往下一层。',
      '階段へ到達可能 · 出発するときにクリック。',
    ),
    partner: t('Matching coordinate', '对应坐标', '対応する座標'),
    safePartner: t(
      'Partner cleared: flagged mines there are now confirmed.',
      '另一盘已完成：其中的雷标记现已确认。',
      '相手盤クリア済み：その地雷印は確定です。',
    ),
    recovered: t(
      'An incompatible or damaged save was ignored. Valid camp history is kept when recoverable.',
      '已忽略不兼容或损坏的存档；可恢复的营地历史会保留。',
      '非互換または破損した保存を無視しました。復元可能なキャンプ履歴は保持します。',
    ),
    journalLimit: t(
      'This run reached the move limit. Extract or start a new pair.',
      '本局已达操作上限，请撤离或重新开始双盘。',
      '手数上限です。帰還するか双子盤を再開してください。',
    ),
    toolHint: t(
      'Drag a tool onto the board, or select one and click a target.',
      '将道具拖到棋盘，或选中后点击目标。',
      '道具を盤面へドラッグ、または選んで対象をクリック。',
    ),
    probeHint: t(
      'Inspect a 3×3 area: gold flags mark mines, green dots mark safe cells.',
      '探测目标周围 3×3：金旗标记地雷，绿点标记安全格。',
      '周囲3×3を探査：金の旗は地雷、緑の点は安全。',
    ),
    scanHint: t(
      'Inspect a whole row: gold flags mark mines, green dots mark safe cells.',
      '扫描整行：金旗标记地雷，绿点标记安全格。',
      '行全体を走査：金の旗は地雷、緑の点は安全。',
    ),
  }
}

/** Describe career tradeoffs with exact starting resources. */
export function professionCopy(language: Language, profession: Profession): VariantDescription {
  switch (profession) {
    case 'explorer':
      return {
        name: localized(language, 'Explorer', '探险家', '探検家'),
        note: localized(language, '2 probes · 1 scan', '2 探针 · 1 扫描', '探針2 · 走査1'),
      }
    case 'surveyor':
      return {
        name: localized(language, 'Surveyor', '测绘师', '測量士'),
        note: localized(language, '1 probe · 2 scans', '1 探针 · 2 扫描', '探針1 · 走査2'),
      }
    case 'engineer':
      return {
        name: localized(language, 'Engineer', '工兵', '工兵'),
        note: localized(
          language,
          '1 probe · 1 scan · 1 shield',
          '1 探针 · 1 扫描 · 1 护盾',
          '探針1 · 走査1 · シールド1',
        ),
      }
  }
}

/** Explain each temporary relic's exact effect and resource cap. */
export function relicCopy(language: Language, relic: Relic): VariantDescription {
  switch (relic) {
    case 'lantern':
      return {
        name: localized(language, 'Lantern', '提灯', 'ランタン'),
        note: localized(
          language,
          '+1 probe on each new floor, up to 4.',
          '每次进入新层 +1 探针，上限 4。',
          '新階層ごとに探針+1、上限4。',
        ),
      }
    case 'lens':
      return {
        name: localized(language, 'Survey lens', '测绘透镜', '測量レンズ'),
        note: localized(
          language,
          '+1 scan on each new floor, up to 4.',
          '每次进入新层 +1 扫描，上限 4。',
          '新階層ごとに走査+1、上限4。',
        ),
      }
    case 'aegis':
      return {
        name: localized(language, 'Aegis', '庇护', '加護'),
        note: localized(
          language,
          'Gain 1 shield once, up to 2. A protected mine receives a locked gold flag; it is never removed.',
          '获得 1 次护盾，上限 2。护盾将踩中的雷标成锁定金旗，不会移除地雷。',
          'シールドを1回獲得、上限2。踏んだ地雷を解除不可の金の旗で示し、地雷は消しません。',
        ),
      }
    case 'purse':
      return {
        name: localized(language, 'Treasure pouch', '藏宝袋', '宝袋'),
        note: localized(
          language,
          'Future treasures give 9 supplies instead of 6.',
          '此后每个宝箱收益从 6 提升至 9。',
          '以後の宝箱報酬が6から9に。',
        ),
      }
    case 'compass':
      return {
        name: localized(language, 'Exit compass', '出口罗盘', '出口の羅針盤'),
        note: localized(
          language,
          'Scout the exit’s 3×3 area each floor, revealing safe cells and marking mines.',
          '每层侦察出口周围 3×3，揭开安全格并标记地雷。',
          '各階の出口周囲3×3を偵察し、安全なマスを開き地雷をマーク。',
        ),
      }
    case 'salvage':
      return {
        name: localized(language, 'Salvage seal', '回收印记', '回収の印'),
        note: localized(
          language,
          'Keep 75% of collected loot on defeat instead of 50%.',
          '失败保留收益从 50% 提升至 75%。',
          '敗北時の回収率が50%から75%に。',
        ),
      }
  }
}

/** Describe finite camp unlocks without hiding their actual gameplay consequence. */
export function upgradeCopy(language: Language, upgrade: Upgrade): VariantDescription {
  if (upgrade === 'surveyor' || upgrade === 'engineer') return professionCopy(language, upgrade)
  return upgrade === 'workshop'
    ? {
        name: localized(language, 'Workshop', '工坊', '工房'),
        note: localized(
          language,
          'Unlock departure equipment. Choose up to 3 points each run.',
          '解锁初始装备，每局最多携带 3 点。',
          '初期装備を解放。毎回3ポイントまで。',
        ),
      }
    : {
        name: localized(language, 'Relic archive', '遗物档案馆', '遺物資料館'),
        note: localized(
          language,
          'Add Exit compass and Salvage seal to future relic offers.',
          '将出口罗盘与回收印记加入后续遗物池。',
          '出口の羅針盤と回収の印を遺物候補に追加。',
        ),
      }
}

/** Describe equipment costs and starting bonuses. */
export function equipmentCopy(language: Language, equipment: Equipment): VariantDescription {
  switch (equipment) {
    case 'probe':
      return {
        name: localized(language, 'Probe kit · 1 pt', '探针包 · 1 点', '探針キット · 1 pt'),
        note: localized(language, '+1 starting probe', '初始 +1 探针', '初期探針+1'),
      }
    case 'scanner':
      return {
        name: localized(language, 'Scanner · 1 pt', '扫描仪 · 1 点', '走査器 · 1 pt'),
        note: localized(language, '+1 starting scan', '初始 +1 扫描', '初期走査+1'),
      }
    case 'guard':
      return {
        name: localized(language, 'Guard · 2 pts', '护盾 · 2 点', '防護 · 2 pt'),
        note: localized(language, '+1 starting shield', '初始 +1 护盾', '初期シールド+1'),
      }
  }
}

/** Name each finite tier in all supported locales, keeping old results explicitly separate. */
export function difficultyCopy(language: Language, difficulty?: VariantDifficulty): string {
  switch (difficulty) {
    case 'relaxed':
      return localized(language, 'Relaxed', '轻松', 'リラックス')
    case 'standard':
      return localized(language, 'Standard', '标准', 'スタンダード')
    case 'advanced':
      return localized(language, 'Advanced', '进阶', 'アドバンス')
    case 'expert':
      return localized(language, 'Expert', '专家', 'エキスパート')
    case 'abyss':
      return localized(language, 'Abyss', '深渊', 'アビス')
    default:
      return variantCopy(language).legacyDifficulty
  }
}
