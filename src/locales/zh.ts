import type { MessageCatalog } from '../types/message-catalog.js'

/** zh interface messages. Keep keys aligned across locales. */
export const zhMessages: MessageCatalog = {
  'survey.mines': '雷',
  'survey.title': '测绘',
  'survey.intro': '沿雷段描图，用行列交叉推理。',
  'survey.opening': '从能填满的一行，或雷段必经的位置开始。',
  'survey.legend': '连续雷段',
  'survey.hint': '根据边缘线索，翻开安全格。',
  'survey.bookkeeping': '“2 1”：两颗相连的雷，隔开后再有一颗。插错旗仍可能踩雷。',
  'survey.line': '第 {number} {axis}：雷段 {runs} · 已插旗 {flags}',
  'survey.moves': '操作数',
  'survey.remaining': '待开安全格',
  'survey.zoom': '放大格子',
  'survey.fit': '适应面板',
  'survey.win': '测绘完成',
  'survey.loss': '测绘中触雷了',
  'survey.rank-hint': '按操作数排名，各难度分别记录。',
  'survey.no-records': '完成一次测绘后，记录会出现在这里。',
  'survey.recovered': '已准备新棋盘，仅保留当前规则下的成绩。',
  'survey.limit': '本局已达到操作上限，请开始新棋盘。',
  'survey.chord': '雷段插齐旗后，快速打开该行列的剩余格；疑似安全标记也会打开。',
  'survey.lesson-title': '测绘 · 读懂雷段',
  'survey.lesson-overlap-title': '找必经的位置',
  'survey.lesson-overlap':
    '第一行有一段连续的 3 颗雷。五格中无论放在哪，都会经过中间。给中间格插旗。',
  'survey.lesson-column-title': '交叉看另一条线',
  'survey.lesson-column': '第二列的 5 表示整列都是雷。给它与第一行相交的格子插旗。',
  'survey.lesson-column-right': '第四列也是 5。标记这个交点，第一行的三连雷就齐了。',
  'survey.lesson-chord-title': '清理已解出的行列',
  'survey.lesson-chord-mode': '点击底部操作按钮，切换到快速开格。',
  'survey.lesson-chord': '点选高亮旗子。它所在行的雷已标齐，两端的安全格会一起打开。',
  'survey.lesson-gap-title': '雷段之间要留空',
  'survey.lesson-reveal-mode': '将底部操作切回翻开。',
  'survey.lesson-gap': '中间行的“2 2”正好是两颗雷、一个空格、两颗雷。翻开中间的空格。',
  'survey.lesson-ending': '按顺序读雷段，段间留空，再交叉看行列。翻开所有安全格即可完成。',
  'echo.shifted': '真身换位了。旧的真身读数已失效，重新扫描。',
  'echo.phase-break': '这一段外壳已击破，回合结束后真身换位。',
  'echo.rhythm': '破绽持续 3 回合。每第 3 回合声波停歇，抓紧走位或攻击。',

  'echo.hunt': '讨伐回声守卫',
  'echo.hunt-note': '击败回声守卫。',
  'echo.flawless': '踏音无痕',
  'echo.flawless-note': '全程不损失生命，击败回声守卫。',
  'echo.precise': '一听即中',
  'echo.precise-note': '总计使用不超过 6 次声呐，击败回声守卫。',
  'echo.flawless-effect': '满生命时，防御 +1。',
  'echo.precise-effect': '回声守卫外壳打开时，攻击 +1。',

  'echo.scene-0': '三道回声，一颗心脏',
  'echo.scene-1': '三尊铜像一动不动。脚步声从三个方向传回来，震得地板上的刻痕都看不清了。',
  'echo.scene-2': '选吧。我的另外两个身体，也在等你的刀。',
  'echo.scene-3': '声音一模一样……可回声停下来的时候，好像还有一处在响。',
  'echo.scene-4': '台阶上的仪器忽然响了一声。几条泛绿的地缝从脚边延伸进房间。',
  'echo.scene-5': '这东西能听见。扫过的这一片要是没动静，就能排除一边，再试另一边。',
  'echo.scene-6': '听得太入神，下一声就会穿过你的身体。',
  'echo.scene-7': '一条地缝亮成了红色。三尊铜像同时吸入一口长气。',
  'echo.scene-8': '找到还在响的那个，靠近，撬开它。声波过来之前，得给自己留条退路。',

  'echo.locate': '扫描各个共鸣体，排除假身。',
  'echo.shell': '找出真身后，靠近并点击它，打开外壳。',
  'echo.fight': '趁破绽攻击，结束回合前离开红色声波区域。',
  'echo.loan': '临时声呐 · {charges}/3 · 充能 {progress}/4',
  'echo.body': '共鸣体 {body}',
  'echo.candidates': '可能的真身：{bodies}',
  'echo.obscured': '模糊数字',
  'echo.reading': '第 {row} 行 {column} 列 · {mines} 雷',
  'echo.present': '区域内有真身',
  'echo.absent': '区域内无真身',
  'echo.stale': '上个阶段',
  'echo.phase-note': '打掉一段血量后真身换位，临时声呐补足 2 次。旧的真身读数失效。',

  'sonar-equipment.name': '声呐',
  'sonar-equipment.note':
    '1 点配装 · 初始 2 次，安全挖开 12 次恢复 1 次，上限 3 次。扫描 3×3 雷数，范围内数字永久清晰，只翻开中心格。',
  'echo.name': '回声守卫',
  'echo.status': '阶段 {phase}/3 · 破绽剩余 {window} 回合',

  'battle-guide.approach-a-revealed-hourglass-and-return-a':
    '靠近已揭开的沙漏，转送法术，解除首领护罩。',
  'battle-guide.approach-the-core-and-activate-it-to': '靠近核心并启动，打开攻击窗口。',
  'battle-guide.clear-eggs-before-they-hatch-and-avoid': '虫卵可以提前清理，落脚时避开攻击预告。',
  'battle-guide.compare-the-boards-a-mine-on-one': '对照两块棋盘：一边是雷，另一边就是安全格。',
  'battle-guide.disable-a-seal-to-expose-the-twin': '关掉这边的封印，才能攻击另一边的双子。',
  'battle-guide.fewer-nests-mean-less-armor-and-healing':
    '巢穴越少，护甲和回血越弱。靠近女王攻击。',
  'battle-guide.flag-nearby-mines-and-destroy-a-nest': '给巢穴周围的雷插旗，拆巢解除免伤。',
  'battle-guide.flag-the-mines-around-both-pylons-then': '先给两座塔周围的雷插旗，再关闭塔。',
  'battle-guide.full-rules': '详细规则',
  'battle-guide.leave-the-marked-cells-before-the-countdown':
    '看准倒计时，在法术落下前离开标记格。',
  'battle-guide.move-1-cell-reveal-1-strike-2':
    '移动每格 1 点 · 揭格额外 1 点 · 攻击 2 点 · 防御 1 点 · 插旗免费',
  'battle-guide.open-a-route-to-an-anchor-then': '揭开通向锚点的路，启动锚点引诱首领。',
  'battle-guide.strike-switch-realms-strike-the-other-twin':
    '打一下就换边，交替攻击；两边的预告都要看。',
  'battle-guide.strike-then-leave-your-echo-it-repeats': '打完离开残影格，回合结束追加等额伤害。',
  'battle-guide.strike-while-exposed-leave-the-red-cells': '趁破绽攻击，结束回合前离开红格。',
  'battle-guide.the-crash-breaks-its-armor-approach-and': '撞击后护甲破开，趁恢复前靠近攻击。',
  'battle-guide.three-moves-to-learn-the-fight': '看懂这三步就能开打',
  'battle-guide.use-the-preparation-turn-to-leave-the': '趁蓄力的回合，撤出锚点周围 3 × 3 爆炸区。',
  'battle-presentation.action-points': '行动力',
  'battle-presentation.approach-and-prime-the-core-1-ap': '靠近并启动核心 · 1 点',
  'battle-presentation.attack': '攻击',
  'battle-presentation.base-5-attack-0-defense-3-ap': '基础：5 攻击 · 0 防御 · 3 行动力',
  'battle-presentation.base-stats-10-health-5-attack-0':
    '基础为 10 生命、5 攻击、0 防御、3 行动力。装备与遗物会改变这些数值，战斗面板可查看来源。移动每格 1 点，揭格另花 1 点，攻击 2 点；其他操作 1 点，插旗免费。',
  'battle-presentation.bastion-guardian': '堡垒守卫',
  'battle-presentation.boss-defeated-full-health-1-shield': '首领已击败 · 生命全满，护盾 +1',
  'battle-presentation.brace-1-ap': '防御 · 1 点',
  'battle-presentation.brace-reduces-this-turn-s-enemy-damage':
    '防御操作使本回合敌方伤害减少 3 点，护甲继续减伤；命中后至少剩 1 点，再由护盾吸收。踩雷与错误校准造成 5 点且无视护甲。每层护盾最多吸收 5 点。胜利恢复全部生命并获得 1 层护盾。',
  'battle-presentation.brood-queen': '育巢女王',
  'battle-presentation.build-effects': '配装效果',
  'battle-presentation.control-disabled': '机关已关闭',
  'battle-presentation.control-reveal-and-flag-neighboring-mines': '机关 · 揭开并标出周围地雷',
  'battle-presentation.controls-2': '机关 {p0}/2',
  'battle-presentation.core-exposed': '核心已暴露',
  'battle-presentation.core-open-turns': '核心暴露 · 剩余 {p0} 回合',
  'battle-presentation.defense': '防御',
  'battle-presentation.defenses': '防御机关',
  'battle-presentation.each-nest-gives-3-armor-and-heals':
    '每座巢穴提供 3 护甲，每回合治疗女王 3 点。摧毁后停止该巢补卵，并对女王造成 3 点伤害。三巢完整时无法直接攻击；全部摧毁后停止回血，女王改为每两回合攻击。',
  'battle-presentation.eggs-hatch-after-two-turns-hatchlings-advance':
    '虫卵两回合孵化。幼虫最多沿安全路线前进两格，虚影显示已确定的落点。每只幼虫造成 3 点伤害，女王造成 5 点，重叠攻击会叠加。清除幼虫可取消对应预告；虫卵与幼虫总数最多 3。',
  'battle-presentation.end-turn': '结束回合',
  'battle-presentation.enemy-attack-forecast': '敌方攻击预告',
  'battle-presentation.nests-3-armor-regen': '巢穴 {p0}/3 · 护甲 {p1} · 每回合回血 {p1}',
  'battle-presentation.reveal-each-control-and-flag-its-neighboring':
    '揭开机关并标出周围的雷。关闭两座机关后，靠近启动核心，在破甲窗口内攻击。',
  'battle-presentation.reveal-nests-and-flag-their-neighboring-mines':
    '揭开巢穴并标出周围的雷，再靠近摧毁。存活巢穴会持续治疗女王并提供护甲。',
  'battle-presentation.row-column-and-cross-attacks-remain-fixed':
    '横行、纵列、十字攻击的预告在结束回合前保持不变。关闭机关的顺序会改变接近核心时可用的减伤与窗口。',
  'battle-presentation.scout-the-nearest-active-objective-with-undiscovered':
    '侦察最近仍有未知信息的活动机关或巢穴。',
  'battle-presentation.strike-2-ap': '攻击 · 2 点',
  'battle-presentation.the-amber-control-reduces-future-attacks-from':
    '琥珀机关使后续攻击从 5 降至 3 点；蓝色机关将核心窗口延长到 4 回合。两座关闭后，点击相邻的关闭核心，花 1 点启动。窗口结束后可再次启动。',
  'battle-presentation.turn': '回合',
  'battle-presentation.turn-ap': '回合行动力',
  'board-controls.chord': '点已开格挖周围安全标记；旗数匹配时也挖未知格。',
  'board-controls.flag': '点未开的格子插旗，再点取消。',
  'board-controls.gestures': '右键 / 长按：循环标记，或快速挖开周围。',
  'board-controls.label': '棋盘操作',
  'board-controls.reveal': '点格子挖开；远征中也可点击已开格移动。',
  'board-controls.safe': '点未开的格子标记疑似安全，再点取消。',
  'board-controls.tap-to-cycle': '点按切换',
  'board-help.chord':
    '右键或长按已开格，挖开周围的安全笔记和确认安全格；旗数匹配时也挖其余邻格。也可用“快速开格”按钮。手动标记可能出错，也会踩雷。',
  'board-help.edge':
    'Edge 内置手势由浏览器控制。若右拖仍会前进或后退，可在 Edge 设置中搜索“鼠标手势”并关闭。',
  'board-help.expeditionChord':
    '快速开格沿已知道路逐格挖掘；Boss 战照常消耗行动点。够不到的格子留下安全笔记，踩雷后停止。按 C 后准星跟随角色。',
  'board-help.extensions': '键盘与鼠标扩展',
  'board-help.gestures':
    '右键松开时执行操作，拖动则取消。若扩展仍触发手势，请为本站关闭手势，也可使用棋盘操作按钮。',
  'board-help.keyboard':
    '方向键 / H J K L 移动光标；Enter / 空格执行所选操作，F 插旗，S 标安全，C 快速开格。',
  'board-help.known': '金色旗：确认有雷；绿色实心点：确认安全。确认结果不能手动取消。',
  'board-help.note':
    '未开格右键或长按，依次切换旗帜、疑似安全、清除。也可选择“标安全”后点格子，再点取消。青色勾是笔记，仍有可能是雷。',
  'board-help.triggered': '红色地雷：已经踩过的雷，护盾挡下也会记录。雷仍在原处。',
  'board-help.vimium': 'Vimium 用户可按 i 暂时透传按键，或为本站设置排除规则；Esc 会退出透传。',
  'boss-prologue.at-the-threshold': '门扉之间',
  'boss-prologue.continue': '继续',
  'boss-prologue.enter-battle': '进入战斗',
  'boss-prologue.explorer': '来访者',
  'boss-prologue.label': '（{p0}）',
  'boss-prologue.previous': '上一段',
  'boss-prologue.skip-arrival': '跳过开场',
  'boss-scripts.a-buried-anchor-answers-the-pulse-with':
    '埋在地里的锚座回应着磁场，发出钟一样的低响。刻着数字的边缘，留着许多撞击的旧痕。',
  'boss-scripts.a-hunger-with-many-mouths': '许多张嘴，同一种饥饿',
  'boss-scripts.a-mark-appears-beneath-your-feet-you':
    '脚下浮出一道刻印。你试着挪开半步，刻印却留在原处，安静地数着什么。',
  'boss-scripts.a-moment-left-behind': '留下来的那一瞬',
  'boss-scripts.a-repeated-blow-is-only-an-invitation':
    '同样的攻击再来一次，只是在邀请我们把它还回去。这支舞，我们已经跳了很多年。',
  'boss-scripts.a-seal-glows-in-the-amber-room':
    '琥珀厅里的封印亮了起来。光线穿过镜面，却缠绕在冷蓝的那位骑士身上。',
  'boss-scripts.a-thread-catches-your-sleeve-then-another':
    '一根细丝挂住袖口，随后又是一根。更深的黑暗里，三座巢穴一鼓一缩，节拍与你的心跳错开。',
  'boss-scripts.an-answer-on-the-other-side': '答案在另一边',
  'boss-scripts.an-egg-rolls-from-the-nearest-nest':
    '最近的巢穴吐出一枚卵。卵壳裂开细缝，女王身上的甲片却扣得更紧了。',
  'boss-scripts.bastion-guardian': '堡垒守卫',
  'boss-scripts.beyond-the-stairs-something-immense-draws-a':
    '楼梯尽头，一扇厚重的“门”缓缓起伏，像在呼吸。房间两端，琥珀与蓝色的光交替亮起。',
  'boss-scripts.borrow-the-enemy-s-strength': '借它的力量',
  'boss-scripts.brood-queen': '育巢女王',
  'boss-scripts.clock-mage-clepsydra': '时钟法师 · 漏刻',
  'boss-scripts.cut-the-silk-if-you-like-my': '想割丝就割吧。孩子们已经挑好了下一次扑向哪里。',
  'boss-scripts.do-not-hurry-i-have-already-reserved': '别急。我已经替你的失败，预留好一个时刻。',
  'boss-scripts.even-your-footsteps-belong-to-my-field':
    '连你的脚步，都在我的领域里。走近些——或者，让我替你挑选落脚的地方。',
  'boss-scripts.i-can-see-their-shadows-gathering-ahead':
    '它们落脚前，影子已经先聚了过去。先清出一条路，一座巢一座巢来，别把快破壳的卵留在背后。',
  'boss-scripts.i-hear-that-little-anchor-singing-when':
    '我听见那座小锚在唱歌了。等我回应时，你最好别站在路上。',
  'boss-scripts.it-has-chosen-a-place-and-a':
    '它选定的是地点和时刻，不是我。只要在那之前离开，它笃定的预言，就只能落在空处。',
  'boss-scripts.magnetic-knight': '磁力骑士',
  'boss-scripts.mirror-twins': '镜像双子',
  'boss-scripts.my-blade-rings-against-its-armor-not':
    '刀刃撞上外壳，连一道划痕也没留下……可刚才那阵脉动，不是从它胸口传来的。',
  'boss-scripts.my-boots-slide-before-i-lift-them':
    '还没抬脚，鞋底就先滑了出去。稳住身体能抵住这股力，可硬拼的话，先耗尽的一定是我。',
  'boss-scripts.no-one-passes-the-walls-remember-every':
    '站住。想从这里过去？先看看你能不能砍穿这身铁甲。',
  'boss-scripts.one-feeds-the-blows-the-other-keeps':
    '琥珀机关在给它的手臂供能，蓝色机关控制着胸口的护甲。得想办法把它们关掉。',
  'boss-scripts.quiet-feet-warm-blood-you-have-come':
    '脚步真轻，血却很暖。走了这么远，是来喂饱我们的吗？',
  'boss-scripts.something-of-each-strike-stays-behind-and':
    '原来，出手之后还有一部分动作留在过去。那些沙漏，也亮着与法术相同的光……落点，也许并非不能改写。',
  'boss-scripts.the-amber-light-brightens-the-guardian-s':
    '琥珀灯一亮，守卫的重臂便抬起来；蓝灯低鸣，胸前刚露出的缝隙又闭合了。',
  'boss-scripts.the-door-that-learned-to-breathe': '会呼吸的门',
  'boss-scripts.the-guardian-settles-its-weight-both-lights':
    '守卫向前踏了一步，地板随之一震。两处机关同时亮起，胸甲深处传来核心转动的声音。',
  'boss-scripts.the-knight-closes-its-fists-for-an':
    '骑士握紧双拳。两层厚甲之间，一点不稳定的光闪了一下，随即又被遮住。',
  'boss-scripts.the-last-grain-of-sand-falls-upward':
    '最后一粒沙，向上落了回去。你已经走下楼梯，影子却迟了一拍才跟上。',
  'boss-scripts.the-mirror-clears-two-paths-wait-and':
    '镜面忽然清澈了。两条路同时等着你，其中一边，上一枚脚印还留着温度。',
  'boss-scripts.the-needle-in-your-compass-turns-sideways':
    '指南针忽然横了过来。地砖上的铁屑像活了一样，缓缓爬向那位一动不动的骑士。',
  'boss-scripts.the-nests-are-more-than-nurseries-if':
    '这些巢不只是在孵卵。让其中一座安静下来，她失去的也许不只是一只幼虫。',
  'boss-scripts.the-pull-is-gathering-not-striking-yet':
    '吸力正在聚拢，还没真正冲来。我还有撤开的时间。也得离锚座远一点——那些裂开的石块，可撑不住下一次撞击。',
  'boss-scripts.the-queen-lifts-herself-from-the-floor':
    '女王缓缓抬离地面。她身后，有什么小东西在卵壳上敲了两下。',
  'boss-scripts.the-rooms-share-a-shape-but-not':
    '两间房形状相同，危险却不重合。这边脚下的雷声，隔着镜面听过去，反而是一片寂静。',
  'boss-scripts.the-wound-i-made-is-closing-something':
    '刚划开的伤口又合上了。有什么东西，正从那些巢穴里流向她。',
  'boss-scripts.their-protection-comes-from-the-other-room':
    '原来，护住它的力量来自另一间房。一直待在这边，是解不开这个结的。',
  'boss-scripts.then-i-change-partners-remember-where-i':
    '那就换一个舞伴。记住两边的落脚点，把发现带过去，别追着同一张脸连续出手。',
  'boss-scripts.then-i-will-read-the-floor-before':
    '先看清脚下哪些地方安全。得先靠过去，等它露出破绽再动手。',
  'boss-scripts.then-send-its-spell-back-to-shatter':
    '那就把法术送回去，打破它的护罩。再打一下撤开，让留下的残影补上一击。',
  'boss-scripts.those-scars-it-has-been-drawn-here':
    '这些撞痕……它以前就被吸过来。如果清出通路、唤醒锚座，也许能让它自己的磁场替我出力。',
  'boss-scripts.touch-my-clocks-if-you-must-borrowed':
    '想碰我的钟，就碰吧。借来的时间，总要找一个人偿还。',
  'boss-scripts.which-of-us-did-you-come-to': '你想攻击的是哪一个？想清楚。我们会记住的。',
  'boss-scripts.you-watch-the-lamps-instead-of-the':
    '盯着那两个机关做什么？小心脚下，别还没走到就丢了命。',
  'boss-scripts.your-hand-drops-but-the-outline-it':
    '手已经收了回来，留在原地的轮廓却仍把动作做完。法师瞥了那道残影一眼，像是有些不悦。',
  'boss-scripts.your-reflection-takes-one-more-step-after':
    '你停下脚步，倒影却又向前走了一步。一间厅堂浸在琥珀色里，另一间落满冷蓝月光。',
  'brood-board.nest-destroyed': '巢穴已摧毁',
  'brood-board.nest-reveal-and-flag-nearby-mines-to': '巢穴 · 揭开并标出周围地雷后摧毁',
  'brood-board.next-hatchling-position': '幼虫下一落点',
  'brood-copy.egg-hatches-in-turns-clear-adjacent-for': '虫卵 · {p0} 回合后孵化 · 相邻清除 1 点',
  'brood-copy.hatchling-clear-adjacent-for-1-ap': '幼虫 · 相邻消灭 1 点',
  'brood-copy.web-clear-adjacent-for-1-ap': '蛛网 · 相邻清除 1 点',
  'camp-copy.achievements': '成就',
  'camp-copy.all': '全部',
  'camp-copy.back-to-camp': '返回营地',
  'camp-copy.build-a-three-point-loadout': '搭配 3 点出发装备',
  'camp-copy.choose-board-size-and-expedition-length': '选择难度、棋盘与层数',
  'camp-copy.choose-your-explorer-and-skill': '选择角色与职业技能',
  'camp-copy.count-floors': '{count} 层',
  'camp-copy.count-unlocked': '已解锁 {count} 项',
  'camp-copy.equipment': '装备',
  'camp-copy.loadout': '出发装备',
  'camp-copy.loadout-points': '装备预算',
  'camp-copy.missions': '任务',
  'camp-copy.need-count-more-supplies': '还差 {count} 物资',
  'camp-copy.no-equipment-selected': '尚未携带装备',
  'camp-copy.purchase': '购买',
  'camp-copy.ready-for-departure': '出发准备',
  'camp-copy.relics': '遗物',
  'camp-copy.select-an-item-to-see-its-effect': '选择商品查看效果。',
  'camp-copy.shop': '商店',
  'camp-copy.unlock-careers-equipment-and-relics': '解锁职业、装备与遗物',
  'camp-copy.unlock-the-workshop-before-buying-and-equipping':
    '先解锁工坊，才能购买和携带出发装备。',
  'camp-template.explore-complete-goals-claim-exclusive-gear': '完成探索目标，领取物资与专属装备',
  'camp-template.long-term-milestones-with-lasting-rewards': '挑战长期目标，解锁遗物与职业',
  'camp-template.ready': '可领取',
  'clock-board.echo': '残影追击 {p0} · {p1}',
  'clock-board.echo-move': '离开残影格后触发',
  'clock-board.echo-pending-damage': '残影 · 待结算伤害 {p0}',
  'clock-board.echo-ready': '已就绪',
  'clock-board.hourglass-reveal-approach-return-earliest-spell-1':
    '沙漏 · 揭开并靠近，转送最早法术 · 1 点',
  'clock-board.last-turn-echo-returned-spell': '上回合：残影 {p0}，转送法术 {p1}',
  'clock-board.spent-hourglass-walkable': '沙漏已使用 · 可通行',
  'clock-copy.an-adjacent-or-occupied-revealed-hourglass-returns':
    '相邻或脚下已揭开的沙漏可花 1 点转送最早触发的敌方法术，每座限用一次。命中造成 6 点首领伤害，并使下一回合不施放新法术；其他已预告法术照常结算。首次转送会永久解除护罩，此前无法攻击首领。地雷和数字不会回溯。',
  'clock-copy.barrier-return-a-spell-first': '护罩中 · 先用沙漏转送法术',
  'clock-copy.clock-hand-damage-3': '时针直线 · 伤害 3',
  'clock-copy.clock-mage-clepsydra': '时钟法师 · 漏刻',
  'clock-copy.delayed-casting': '延迟施法',
  'clock-copy.dual-countdown': '双重倒计时',
  'clock-copy.each-turn-starts-with-a-walkable-echo':
    '每回合开始在脚下留下可通行残影，离开残影所在格后，回合结束追加首次有效攻击的等额伤害，不额外触发道具或技能。敌方法术先结算，玩家死亡则取消补刀。',
  'clock-copy.hourglasses-3': '沙漏 {p0}/3',
  'clock-copy.in-turn-ends': '第 {p0} 次结束时触发',
  'clock-copy.marks-deal-3-damage-after-two-turn':
    '刻印在两次结束回合后造成 3 点伤害；半血后增加三次结束回合触发的直线攻击，重叠伤害相加。预告不会追踪移动；若已知道路无法避开新组合，则缩小或跳过新攻击。',
  'clock-copy.recovery-no-new-spell': '恢复期 · 不施放新法术',
  'clock-copy.return-a-spell-with-an-hourglass-to':
    '先靠近沙漏转送法术，解除首领护罩。再攻击、撤离，让残影补刀。',
  'clock-copy.returned-spell-boss-damage-6': '已转送 · 对首领造成 6 点伤害',
  'clock-copy.spell-returned-deadline-unchanged': '法术已转送 · 倒计时不变',
  'clock-copy.this-turn-end': '本次结束时触发',
  'clock-copy.time-mark-damage-3': '延时刻印 · 伤害 3',
  'combat-build-copy.1-ap-every-combat-turn-up-to': '每个战斗回合行动力 +1，总上限 5。',
  'combat-build-copy.1-loadout-point-starting-and-maximum-health':
    '装备预算 1 点。初始生命与生命上限 +2。',
  'combat-build-copy.1-loadout-point-the-first-control-or':
    '装备预算 1 点。每回合首次关闭机关或封印、摧毁巢穴、校准锚点，返还 1 点行动力。',
  'combat-build-copy.1-loadout-point-the-first-web-egg':
    '装备预算 1 点。每回合首次清除蛛网、虫卵或幼虫，返还 1 点行动力。',
  'combat-build-copy.2-loadout-points-1-ap-on-even': '装备预算 2 点。偶数回合行动力 +1，总上限 5。',
  'combat-build-copy.2-loadout-points-attack-2': '装备预算 2 点。攻击 +2。',
  'combat-build-copy.2-loadout-points-defense-1-against-enemy':
    '装备预算 2 点。防御 +1，减少敌方攻击伤害，不减免踩雷伤害。',
  'combat-build-copy.add-attack-defense-and-action-point-relics':
    '将攻击、防御和行动力遗物加入后续远征奖励池。',
  'combat-build-copy.attack-3-for-this-expedition': '本次远征攻击 +3。',
  'combat-build-copy.battle-manual': '战术手册',
  'combat-build-copy.clearing-hook': '破障钩',
  'combat-build-copy.defense-1-against-enemy-attacks-for-this':
    '本次远征防御 +1，减免敌方攻击伤害。',
  'combat-build-copy.endurance-training': '耐力训练',
  'combat-build-copy.field-boots': '行军靴',
  'combat-build-copy.focus-lens': '校准透镜',
  'combat-build-copy.layered-armor': '层叠护甲',
  'combat-build-copy.medical-kit': '医疗包',
  'combat-build-copy.mines-deal-5-damage-each-shield-absorbs':
    '地雷造成 5 点伤害。每层护盾最多吸收 5 点；过层恢复 5 点生命。护甲只减免敌方攻击。',
  'combat-build-copy.one-purchase-only-base-attack-1-on': '仅可购买一次。此后出发的基础攻击 +1。',
  'combat-build-copy.one-purchase-only-starting-and-maximum-health':
    '仅可购买一次。此后出发的初始生命与生命上限 +1。',
  'combat-build-copy.plated-vest': '鳞甲背心',
  'combat-build-copy.steel-blade': '精钢短刃',
  'combat-build-copy.tactics-hourglass': '战术沙漏',
  'combat-build-copy.tempered-edge': '淬火锋刃',
  'combat-build-copy.weapon-training': '武器训练',
  'journey-relic-copy.a-row-scan-confirming-at-least-2':
    '整行扫描新确认至少 2 颗雷后，补充 1 根探针。每层一次，上限 4。',
  'journey-relic-copy.add-breach-sigil-and-duelist-edge-recover':
    '将破阵印记、决斗锋刃加入遗物池：破盾返还行动点，强化首次攻击。',
  'journey-relic-copy.add-marching-boots-and-shelter-cloak-cheaper':
    '将行军靴、避风斗篷加入遗物池：节省战斗移动点数，避开预警获得护盾。',
  'journey-relic-copy.add-probe-recycler-and-spare-coil-recover':
    '将探针回收器、备用线圈加入遗物池：回收探针，让整行扫描补充工具。',
  'journey-relic-copy.add-reserve-watch-and-second-hand-bank':
    '将储时怀表、回响秒针加入遗物池：留存一次回合余力，持久战补充道具。',
  'journey-relic-copy.add-skill-capacitor-and-emergency-gears-link':
    '将技能蓄能器、应急齿轮加入遗物池：技能补充扫描，扫描补充耗尽的探针。',
  'journey-relic-copy.add-trail-thread-and-landmark-lens-earn':
    '将路标线、地标透镜加入遗物池：走路补充扫描，宝箱侦察周边。',
  'journey-relic-copy.after-surviving-the-third-combat-turn-gain':
    '存活至战斗第三回合结束，补充 1 根探针和 1 次扫描。每层一次，各自上限 4。',
  'journey-relic-copy.breach-sigil': '破阵印记',
  'journey-relic-copy.cartographer-charts': '制图图册包',
  'journey-relic-copy.chronologist-dials': '时序刻盘包',
  'journey-relic-copy.duelist-edge': '决斗锋刃',
  'journey-relic-copy.duelist-marks': '决斗徽记包',
  'journey-relic-copy.emergency-gears': '应急齿轮',
  'journey-relic-copy.end-a-combat-turn-outside-the-warning':
    '战斗中，在预警区外结束回合可获得 1 层护盾。每层一次，上限 2。',
  'journey-relic-copy.first-control-or-seal-disabled-or-anchor':
    '每层首次关闭机关、封印或校准锚点，返还 1 点行动力，总上限 5。',
  'journey-relic-copy.first-strike-each-floor-4-damage': '每层首次攻击伤害 +4。',
  'journey-relic-copy.in-combat-your-first-walk-of-2':
    '战斗中，每回合首次移动至少 2 格时少花 1 点行动点，最低消耗 1 点。不影响揭格。',
  'journey-relic-copy.landmark-lens': '地标透镜',
  'journey-relic-copy.marching-boots': '行军靴',
  'journey-relic-copy.mechanist-gears': '机巧齿轮包',
  'journey-relic-copy.once-per-floor-end-a-turn-with':
    '每层一次，结束回合时保留至少 1 点行动力，下一回合额外 +1，总上限 5。',
  'journey-relic-copy.probe-recycler': '探针回收器',
  'journey-relic-copy.refund-the-first-probe-each-floor-that':
    '每层首次探针获得新信息但未新确认雷时，返还该探针。',
  'journey-relic-copy.reserve-watch': '储备怀表',
  'journey-relic-copy.salvager-kit': '回收工具包',
  'journey-relic-copy.second-hand': '回响秒针',
  'journey-relic-copy.shelter-cloak': '避风斗篷',
  'journey-relic-copy.skill-capacitor': '技能蓄能器',
  'journey-relic-copy.spare-coil': '备用线圈',
  'journey-relic-copy.the-first-chest-collected-each-floor-surveys':
    '每层收集的第一个宝箱会侦察其周围 3×3 区域。',
  'journey-relic-copy.trail-thread': '路标线',
  'journey-relic-copy.use-a-row-scan-while-out-of':
    '没有探针时使用整行扫描，补充 2 根探针。每层一次，上限 4。',
  'journey-relic-copy.using-your-profession-skill-grants-1-scan':
    '使用职业技能后补充 1 次扫描。每层一次，上限 4。',
  'journey-relic-copy.visit-12-new-safe-squares-to-gain':
    '每层走过 12 个新的安全格，补充 1 次扫描，上限 4。重复走过不计数。',
  'journey-relic-copy.wayfarer-tokens': '旅者信物包',
  'magnetic-board.anchor-reveal-and-flag-surrounding-mines': '锚点 · 揭开并标出周围地雷',
  'magnetic-board.calibrated-anchor-enter-to-ground-click-again': '已校准锚点 · 移入稳固，再点牵引',
  'magnetic-board.detonated-mine-walkable-crater': '地雷已炸毁 · 弹坑可通行',
  'magnetic-copy.a-crash-opens-the-entire-3-3':
    '撞锚揭开整个 3×3 区域，炸毁地雷与阻路地形，留下可通行弹坑，数字随剩余地雷更新。骑士受到 6 点伤害，每颗引爆的雷追加 1 点、最多追加 3 点，至少剩 1 生命，随后核心暴露三回合。爆区内角色另受一次 5 点基础爆炸伤害；冲锋和爆炸分别计算防御减免，最低各 1 点。普通踩雷仍会留下不可通行的雷。',
  'magnetic-copy.activation-cancels-the-pulse-the-first-end':
    '启动后停止脉冲。第一次结束回合只蓄力，再给你一个完整回合撤离，第二次结束回合才冲锋。避开金色路线与标出的 3×3 爆区；占住锚点会阻止撞锚。冲锋经过角色造成 5 点基础伤害。',
  'magnetic-copy.anchor-calibrated-lure-committed': '锚点已校准 · 牵引就绪',
  'magnetic-copy.arrows-show-the-next-magnetic-pulse-blue':
    '箭头显示下一次磁力脉冲：蓝色向骑士所在轴线吸引，珊瑚色向外排斥，最多两格。虚影显示预计落点；琥珀虚线路径经过未确认的格子，不会透露暗雷。',
  'magnetic-copy.attract': '吸引 · {p0}',
  'magnetic-copy.brace-for-1-ap-to-reduce-forced':
    '花 1 点行动力进行防御，使推拉距离减少 1 格，已校准的锚点也能稳住角色。遇雷会停在雷前并受到 5 点无视防御的伤害。撞墙或边界造成 3 点基础伤害，可被防御减免，最低 1 点。每第三回合没有脉冲。',
  'magnetic-copy.charge-at-end-turn-leave-the-route': '本回合结束时冲锋 · 撤出路线与 3×3 爆区',
  'magnetic-copy.charging-one-full-escape-turn-after-end': '蓄力中 · 结束回合后还有一整回合撤离',
  'magnetic-copy.clear-a-route-to-an-anchor-calibrate':
    '开路到锚点，校准后牵引骑士，趁核心暴露时攻击。',
  'magnetic-copy.collision-base-3-damage-reduced-by-defense': '碰撞 · 基础 3 点伤害，防御可减免',
  'magnetic-copy.core-exposed-turns': '核心暴露 · {p0} 回合',
  'magnetic-copy.defeated': '已击败',
  'magnetic-copy.grounded-resist-displacement': '已稳固 · 抵抗位移',
  'magnetic-copy.horizontal': '横向',
  'magnetic-copy.known-mine-on-the-route': '路线经过已知雷',
  'magnetic-copy.magnetic-knight': '磁力骑士',
  'magnetic-copy.projected-landing': '预计落点',
  'magnetic-copy.projected-route-unverified-cells': '预计路线 · 经过未确认格',
  'magnetic-copy.recharge-no-pulse': '蓄能 · 本回合无脉冲',
  'magnetic-copy.repel': '排斥 · {p0}',
  'magnetic-copy.reveal-an-anchor-and-flag-its-surrounding':
    '揭开锚点并标出周围的雷，在锚点上或相邻格点击，花 1 点启动。骑士到锚点之间需要至少两格长的已揭开通路；校准错误受到 5 点伤害。再次牵引无需重复校准。',
  'magnetic-copy.vertical': '纵向',
  'milestone-copy.abyss-veteran': '深渊常客',
  'milestone-copy.acquire-8-different-relics-across-expeditions-offers':
    '累计实际获得 8 种不同遗物，仅看到候选不计数。',
  'milestone-copy.against-the-clock': '逆时而行',
  'milestone-copy.beyond-the-entrance': '深入地下',
  'milestone-copy.beyond-the-mirror': '镜外之人',
  'milestone-copy.boss-challenger': '迎战强敌',
  'milestone-copy.boss-hunter': '讨伐专家',
  'milestone-copy.break-the-bastion': '攻破壁垒',
  'milestone-copy.cache-runner': '宝箱快递员',
  'milestone-copy.cache-seeker': '寻宝好手',
  'milestone-copy.clear-5-floors-across-expeditions': '累计通过 5 层地牢。',
  'milestone-copy.clock-hunt': '击败时钟守卫',
  'milestone-copy.collect-3-treasure-chests-across-expeditions': '累计拾取 3 个宝箱。',
  'milestone-copy.deep-descent': '向下深入',
  'milestone-copy.defeat-10-bosses-across-expeditions': '累计击败 10 个 BOSS。',
  'milestone-copy.defeat-both-twins-without-losing-health-revival':
    '整场战斗不损失生命，击败镜像双子。触发复活也算受伤。',
  'milestone-copy.defeat-four-different-boss-families': '击败任意四种不同的首领。',
  'milestone-copy.defeat-the-bastion-without-losing-health-revival':
    '整场战斗不损失生命，击败壁垒守卫。触发复活也算受伤。',
  'milestone-copy.defeat-the-brood-queen-without-clearing-any':
    '整场战斗不清理任何蛛网，击败育巢女王。',
  'milestone-copy.defeat-the-clock-boss-using-exactly-one': '整场只使用一座沙漏，击败时钟 BOSS。',
  'milestone-copy.defeat-the-magnetic-boss-without-being-pushed':
    '整场战斗不被磁场推拉到地雷上，并击败磁力 BOSS。护盾挡住伤害也算碰雷。',
  'milestone-copy.defeat-the-queen-while-leaving-at-least': '保留至少一座巢穴，击败育巢女王。',
  'milestone-copy.defeat-this-boss-once': '击败该 BOSS 一次。',
  'milestone-copy.defeat-your-first-boss': '击败任意 1 个 BOSS。',
  'milestone-copy.demolition-expert': '爆破专家',
  'milestone-copy.depth-legend': '地底传说',
  'milestone-copy.field-practice': '技能实战',
  'milestone-copy.first-challenger': '初战告捷',
  'milestone-copy.first-footsteps': '踏上旅途',
  'milestone-copy.four-legends': '四大强敌',
  'milestone-copy.homeward-bound': '凯旋归来',
  'milestone-copy.into-the-abyss': '深渊征服者',
  'milestone-copy.into-the-nest': '虎口拔牙',
  'milestone-copy.long-road': '漫漫长路',
  'milestone-copy.lure-a-charge-into-at-least-one':
    '引诱磁力 BOSS 冲撞引爆至少一枚地雷，并击败它。',
  'milestone-copy.magnet-hunt': '击败磁力守卫',
  'milestone-copy.master-of-magnetism': '磁场掌控者',
  'milestone-copy.queen-hunt': '猎杀育巢女王',
  'milestone-copy.relic-curator': '遗物收藏家',
  'milestone-copy.relic-museum': '移动博物馆',
  'milestone-copy.return-route': '归途有记',
  'milestone-copy.rift-pioneer': '裂隙先驱',
  'milestone-copy.seasoned-explorer': '远征老兵',
  'milestone-copy.skill-adept': '实战达人',
  'milestone-copy.skill-legend': '千锤百炼',
  'milestone-copy.skill-master': '技艺精通',
  'milestone-copy.skill-student': '熟能生巧',
  'milestone-copy.successfully-use-a-profession-skill-3-times': '累计成功使用 3 次职业技能。',
  'milestone-copy.total-1-expedition-victory': '累计 1 次远征通关。',
  'milestone-copy.total-10-chests-collected': '累计 10 个宝箱。',
  'milestone-copy.total-10-successful-profession-skills': '累计 10 次成功的职业技能。',
  'milestone-copy.total-12-floors-cleared': '累计 12 层地牢。',
  'milestone-copy.total-150-floors-cleared': '累计 150 层地牢。',
  'milestone-copy.total-150-new-safe-squares-visited': '累计 150 个新的安全格（同层重复不计）。',
  'milestone-copy.total-1500-new-safe-squares-visited': '累计 1500 个新的安全格（同层重复不计）。',
  'milestone-copy.total-20-different-relics-acquired': '累计 20 种实际获得的不同遗物。',
  'milestone-copy.total-200-chests-collected': '累计 200 个宝箱。',
  'milestone-copy.total-200-successful-profession-skills': '累计 200 次成功的职业技能。',
  'milestone-copy.total-25-chests-collected': '累计 25 个宝箱。',
  'milestone-copy.total-25-floors-cleared': '累计 25 层地牢。',
  'milestone-copy.total-25-successful-profession-skills': '累计 25 次成功的职业技能。',
  'milestone-copy.total-3-bosses-defeated': '累计 3 个 BOSS。',
  'milestone-copy.total-5-abyss-victories': '累计 5 次深渊难度通关。',
  'milestone-copy.total-50-floors-cleared': '累计 50 层地牢。',
  'milestone-copy.total-500-new-safe-squares-visited': '累计 500 个新的安全格（同层重复不计）。',
  'milestone-copy.total-60-new-safe-squares-visited': '累计 60 个新的安全格（同层重复不计）。',
  'milestone-copy.total-75-chests-collected': '累计 75 个宝箱。',
  'milestone-copy.total-75-successful-profession-skills': '累计 75 次成功的职业技能。',
  'milestone-copy.trail-apprentice': '行路学徒',
  'milestone-copy.trail-guide': '探路向导',
  'milestone-copy.treasure-legend': '寻宝传奇',
  'milestone-copy.treasure-scout': '寻宝入门',
  'milestone-copy.treasure-vault': '满载而归',
  'milestone-copy.twin-hunt': '击败镜像双子',
  'milestone-copy.untouched-bulwark': '不动如山',
  'milestone-copy.visit-20-new-safe-squares-across-expeditions':
    '累计走过 20 个新的安全格。同层重复走过不计数。',
  'milestone-copy.web-walker': '蛛网漫步者',
  'milestone-copy.win-3-expeditions-existing-camp-victories-count':
    '通关 3 次远征，已有营地通关记录也计入。',
  'milestone-copy.win-an-expedition-on-abyss-difficulty': '在深渊难度通关 1 次远征。',
  'milestone-copy.world-walker': '行遍地下',
  'milestone-notices.achievement': '成就',
  'milestone-notices.completed': '已完成',
  'milestone-notices.dismiss': '关闭提示',
  'milestone-notices.halfway-there': '进度过半',
  'milestone-notices.mission': '任务',
  'milestone-template.claim-reward': '领取奖励',
  'milestone-template.claimed': '已领取',
  'milestone-template.completed': '已完成',
  'milestone-template.in-progress': '进行中',
  'milestone-template.keep-exploring': '继续探索',
  'milestone-template.ready-to-claim': '可领取',
  'milestone-template.title': '称号',
  'mirror-board.compare-shift-to-play': '对照 · 切换后操作',
  'mirror-board.explore-here': '当前镜域',
  'mirror-board.seal-disabled': '封印已关闭',
  'mirror-board.seal-protects-the-opposite-twin': '封印 · 保护另一侧的双子',
  'mirror-copy.compare-both-realms-disable-each-seal-to':
    '对照两侧线索，关闭封印以解除另一侧的防御，再交替攻击双子。',
  'mirror-copy.dawn': '曙光',
  'mirror-copy.dawn-alternates-rows-and-columns-dusk-alternates':
    '曙光交替攻击横行与纵列，暮影交替攻击两条斜线；每第三回合双方蓄能，不攻击。预告在结束回合前固定，只有当前镜域会造成伤害，切换不会自动结束回合。',
  'mirror-copy.defeated': '已击败',
  'mirror-copy.dusk': '暮影',
  'mirror-copy.exposed': '可攻击',
  'mirror-copy.mirror-seal-protects-the-opposite-twin': '镜像封印 · 保护另一侧的双子',
  'mirror-copy.mirror-twins': '镜像双子',
  'mirror-copy.protected-by-seal': '{p0}封印保护中',
  'mirror-copy.reflecting-strike-the-other-twin': '反射中 · 攻击另一位双子',
  'mirror-copy.reveal-a-seal-correctly-flag-every-neighboring':
    '揭开封印、正确标出周围所有雷，再靠近花 1 点关闭。每座封印保护另一侧的双子，校准错误受到 5 点伤害。',
  'mirror-copy.seal-disabled-opposite-twin-exposed': '封印已关闭 · 另一侧防御解除',
  'mirror-copy.shift-costs-1-ap-and-resumes-your':
    '切换镜域花 1 点，回到另一侧上次停留的位置。对照棋盘仅供查看；两侧位置分别保留，生命、道具、技能次数和遗物限制共用。',
  'mirror-copy.the-same-coordinate-cannot-contain-a-mine':
    '同一坐标不会在两个镜域同时有雷。对照数字与旗帜推理；金色确认雷会把另一侧对应格标为安全，普通旗仍只是你的判断。',
  'mirror-copy.while-both-twins-live-striking-one-activates':
    '双子都存活时，受击一方会进入反射状态，攻击另一方才能解除。击败一方会取消其预告；幸存者失去反射，后续伤害从 5 提至 7。',
  'mirror-template.attacks-resolve-at-end-turn-both-recharge':
    '结束回合时结算攻击 · 每第三回合双方蓄能',
  'mirror-template.mirror-twins': '镜像双子',
  'mirror-template.recharging-no-enemy-attacks-this-turn': '蓄能回合 · 双方本回合不攻击',
  'profession-skill-copy.available-during-exploration': '探索时可用',
  'profession-skill-copy.check-the-cost-and-resource-caps': '资源不足或已达上限',
  'profession-skill-copy.choose-a-revealed-safe-landing-two-squares':
    '选择隔着一格已确认地雷或墙、两格外已揭开的安全落点，消耗一次行动穿越，每层一次。双向裂隙在当前房间保留，可正常往返；不改雷和数字，不能穿过 BOSS 本体。',
  'profession-skill-copy.column-survey': '纵向测绘',
  'profession-skill-copy.confirm-mines-and-safe-cells-in-the':
    '侦察角色周围 3×3，标出地雷和安全格。',
  'profession-skill-copy.confirm-mines-and-safe-cells-in-your':
    '侦察角色所在整列，标出地雷和安全格。',
  'profession-skill-copy.excavate': '寻宝发掘',
  'profession-skill-copy.field-repair': '战地修护',
  'profession-skill-copy.first-use-places-an-anchor-at-your':
    '首次在脚下放置锚点，再次使用回到锚点。两次操作各消耗一次行动，每层可回撤一次；仅当前房间有效，落点被占用时不可回撤。',
  'profession-skill-copy.move-away-from-the-anchor-its-landing': '先离开锚点；回撤落点须未被占用',
  'profession-skill-copy.no-new-information-here-reposition-or-explore':
    '这里没有新信息 · 移动或继续探索',
  'profession-skill-copy.open-rift': '开辟裂隙',
  'profession-skill-copy.return-anchor': '归途锚点',
  'profession-skill-copy.reveal-a-safe-landing-across-a-confirmed':
    '先揭开隔着一格已确认地雷或墙的安全落点（两格外）',
  'profession-skill-copy.scout-the-nearest-uncollected-chest-s-3':
    '侦察最近未收集宝箱周围 3×3，揭开安全格并标雷。走到宝箱才能领取。遗物奖励最多四选一。',
  'profession-skill-copy.spend-1-scan-to-gain-1-shield':
    '消耗 1 次扫描，获得 1 点护盾；护盾上限 2。',
  'profession-skill-copy.spend-1-shield-to-confirm-mines-and':
    '消耗 1 点护盾，侦察角色周围 5×5，标出地雷和安全格。',
  'profession-skill-copy.spend-1-shield-to-gain-1-probe':
    '消耗 1 点护盾，获得 1 探针和 1 次扫描；两种道具都须低于上限 4。',
  'profession-skill-copy.trail-light': '探路灯',
  'profession-skill-copy.transmute': '炼成',
  'profession-skill-copy.use-once-per-floor': '使用 · 每层一次',
  'profession-skill-copy.used-refreshes-next-floor': '本层已用 · 下一层恢复',
  'profession-skill-copy.watchtower': '守望之眼',
  'profession-skill-template.cross-to': '穿越至',
  'profession-skill-template.next-use-place-anchor': '下次使用：放置锚点',
  'profession-skill-template.not-enough-action-points-end-your-turn': '行动点不足，先结束回合',
  'profession-skill-template.return-anchor-row-column': '回撤锚点（行，列）',
  'relic-expansion-copy.a-probe-confirming-2-new-mines-grants':
    '一次探针新确认至少 2 颗雷，补充 1 次扫描。每层一次，上限 4。',
  'relic-expansion-copy.add-field-dressing-and-second-wind-chest':
    '将行军绷带、余烬护符加入后续遗物池：宝箱治疗与一次绝境生还。',
  'relic-expansion-copy.add-field-notes-and-rangefinder-to-future':
    '将勘探笔记、测距镜加入后续遗物池：利用新发现补充道具。',
  'relic-expansion-copy.add-reactive-shell-and-rescue-ribbon-shield':
    '将反应甲片、救援绶带加入后续遗物池：护盾侦察与受伤保护。',
  'relic-expansion-copy.add-supply-cache-and-cache-guard-recover':
    '将补给暗格、寻宝护印加入后续遗物池：收集宝箱补充扫描和护盾。',
  'relic-expansion-copy.cache-guard': '寻宝护印',
  'relic-expansion-copy.collect-all-3-chests-on-a-floor':
    '收集本层全部 3 个宝箱后获得 1 层护盾。每层一次，上限 2。',
  'relic-expansion-copy.confirm-3-mines-on-a-floor-to':
    '每层确认 3 颗雷后，补充 1 根探针。每层一次，上限 4。',
  'relic-expansion-copy.field-dressing': '野战绷带',
  'relic-expansion-copy.field-notes': '勘探笔记',
  'relic-expansion-copy.first-chest-each-floor-restores-5-health': '每层首个宝箱恢复 5 点生命。',
  'relic-expansion-copy.guardian-crests': '守护纹章包',
  'relic-expansion-copy.once-per-expedition-survive-lethal-damage-with':
    '每局一次，受到致命伤害后以 5 点生命存活。',
  'relic-expansion-copy.prospector-seals': '寻宝印记包',
  'relic-expansion-copy.rangefinder': '测距镜',
  'relic-expansion-copy.reactive-shell': '反应甲片',
  'relic-expansion-copy.rescue-ribbon': '救援绶带',
  'relic-expansion-copy.second-wind': '绝境重生',
  'relic-expansion-copy.supply-cache': '补给暗格',
  'relic-expansion-copy.surveyor-notes': '勘探手记包',
  'relic-expansion-copy.survival-charms': '生存护符包',
  'relic-expansion-copy.survive-health-damage-to-gain-1-shield':
    '扣血后存活，获得 1 层护盾。每局一次，上限 2。',
  'relic-expansion-copy.the-first-chest-collected-each-floor-grants':
    '每层收集的第一个宝箱补充 1 次扫描，上限 4。',
  'relic-expansion-copy.the-first-shielded-mine-hit-each-floor':
    '每层首次用护盾挡雷时，侦察该雷周围 3×3 区域。',
  'sonar-copy.already-scanned-reading-selected': '已扫描，已选中这份读数',
  'sonar-copy.choose-send-pulse-then-a-center-square':
    '点击声呐扫描，再选择中心格。读数统计周围 3 × 3 范围的全部地雷，边缘处按实际格数计算。地雷位置不会改变，也不会逐格揭示。',
  'sonar-copy.choose-the-center-of-a-3-3': '选择 3 × 3 区域的中心，Esc 取消。',
  'sonar-copy.compare-echoes': '对照回声',
  'sonar-copy.compare-two-echoes': '对照两次回声',
  'sonar-copy.echo': '回声',
  'sonar-copy.echo-log': '回声记录',
  'sonar-copy.enlarge-squares': '放大格子',
  'sonar-copy.every-echo-accounted-for': '回声落定，雷区已清。',
  'sonar-copy.exclusive-region': '独有区域',
  'sonar-copy.fewest-moves-first-fewer-pulses-break-ties': '操作数越少越靠前，同分时比较扫描次数。',
  'sonar-copy.fit-board': '适应宽度',
  'sonar-copy.make-each-pulse-count': '把回声用在关键处',
  'sonar-copy.mine-difference-outside-the-overlap': '去掉重叠部分后的雷数差',
  'sonar-copy.mines': '颗雷',
  'sonar-copy.moves': '操作数',
  'sonar-copy.no-pulses-left-four-safe-excavations-recharge':
    '扫描已用完。每安全挖开 4 次可补 1 次。',
  'sonar-copy.one-echo-left-unanswered': '还有一处回声未解。',
  'sonar-copy.open-a-square-to-start': '先挖开一格。',
  'sonar-copy.open-the-board': '打开棋盘',
  'sonar-copy.pulses-left': '剩余扫描',
  'sonar-copy.pulses-used': '扫描次数',
  'sonar-copy.scan-target': '扫描目标',
  'sonar-copy.scan-to-open-the-center-mines-become':
    '拖入声呐测量区域雷数，揭开中心格，雷变金旗。每安全挖开 4 次，补充 1 次扫描。',
  'sonar-copy.select-a-square-to-open-it': '点格子挖开。',
  'sonar-copy.select-two-log-entries-their-shared-squares':
    '选中两份记录，重叠部分在相减时抵消。两份总数的差，就是各自独有区域的雷数差。普通旗帜仍是自己的判断。',
  'sonar-copy.select-two-readings-to-compare-their-regions': '选中两份读数，对照各自的范围。',
  'sonar-copy.send-pulse': '声呐扫描',
  'sonar-copy.shared-squares': '重叠格数',
  'sonar-copy.sonar': '声呐',
  'sonar-copy.spend-a-pulse': '发出回声',
  'sonar-copy.start-with-three-pulses-four-safe-excavation':
    '开局三次扫描，每安全挖开四次补一次；点击选点或拖入声呐，揭开中心格，地雷变成金旗。扫描范围内的数字永久清晰，其他格子仍需自己挖开。重复选取同一中心只调出旧读数。Q 瞄准，Enter / 空格扫描，Esc 取消；F 插旗，S 标记疑似安全，C 快速开格，右键或长按循环标记。扫描次数与棋盘操作数分开记录。',
  'sonar-copy.the-first-opening-and-its-neighbors-are':
    '第一格及相邻区域安全。挖开所有安全格即可获胜。',
  'sonar-copy.the-saved-puzzle-could-not-be-restored': '这张旧棋盘无法恢复，已保留有效纪录。',
  'sonar-copy.this-puzzle-reached-its-move-limit-start': '本局操作已达上限，请开始新棋盘。',
  'sonar-copy.tutorial': '新手教程',
  'sonar-copy.your-first-clear-belongs-here': '等待你的第一次通关。',
  'sonar-copy.your-readings-will-appear-here': '扫描读数会留在这里。',
  'sonar-view.confirmed-mine': '已确认地雷',
  'sonar-view.obscured-clue-scan-to-clarify': '模糊数字 · 扫描后看清',
  'sonar-view.recharge': '充能',
  'sonar-view.recharge-progress-label': '安全挖掘充能',
  'tactical-copy.already-used-or-the-target-is-cleared': '该操作已完成，或目标已清除',
  'tactical-copy.anchors-recharge-after-the-lure-and-exposure': '牵引或破甲期间无法再次启动锚点',
  'tactical-copy.approach-and-click-the-core-to-prime': '靠近并点击核心，花 1 点启动',
  'tactical-copy.attack-avoided-or-blocked': '已避开或挡住攻击',
  'tactical-copy.battle-in-progress-watch-the-attack-forecast': '战斗进行中 · 留意攻击预告',
  'tactical-copy.braced-reduce-enemy-damage-by-3-this': '已防御 · 本回合敌方伤害减少 3',
  'tactical-copy.calibration-failed-5-damage': '校准错误 · 受到 5 点伤害',
  'tactical-copy.choose-a-reachable-cell': '选择可到达的格子',
  'tactical-copy.core-overloaded-three-turn-strike-window': '磁芯过载 · 三回合破甲窗口',
  'tactical-copy.core-primed-strike-window-open': '核心已启动 · 破甲窗口开启',
  'tactical-copy.cost-ap': '消耗 {p0} 点行动力',
  'tactical-copy.deduce-and-destroy-nests-to-weaken-the': '先推理并摧毁巢穴，削弱女王护甲',
  'tactical-copy.disable-both-shield-pylons-first': '先关闭两座护盾机关',
  'tactical-copy.disable-the-seal-in-the-opposite-realm': '先关闭另一侧镜域的封印',
  'tactical-copy.egg-destroyed-hatching-prevented': '虫卵已摧毁 · 孵化取消',
  'tactical-copy.enemy-attack-hit': '敌方攻击命中',
  'tactical-copy.flag-all-mines-around-the-target-first': '先标出目标周围的全部地雷',
  'tactical-copy.grounded-resist-the-pulse-and-reduce-enemy':
    '已稳固 · 抵抗本回合磁力，敌方伤害减少 3',
  'tactical-copy.hatchling-intercepted-attack-cancelled': '幼虫已消灭 · 攻击预告取消',
  'tactical-copy.lure-locked-clear-the-gold-route': '牵引已锁定 · 让出金色路线',
  'tactical-copy.lure-the-knight-into-an-anchor-to': '启动锚点，牵引骑士撞击后破甲',
  'tactical-copy.magnetic-displacement-resisted': '已抵抗磁力位移',
  'tactical-copy.move-next-to-the-target-first': '请移动到目标相邻格',
  'tactical-copy.needs-ap-shorten-the-route-or-end': '需要 {p0} 点行动力 · 请缩短路线或结束回合',
  'tactical-copy.nest-destroyed-supply-stopped-queen-armor-and':
    '巢穴已摧毁 · 停止补卵，女王护甲与回血降低',
  'tactical-copy.one-twin-defeated-the-survivor-s-future': '一位双子已倒下 · 幸存者后续攻击增强',
  'tactical-copy.open-a-route-of-at-least-two': '先揭开骑士到锚点的通路，至少留出两格牵引距离',
  'tactical-copy.realm-shifted-the-turn-continues': '已切换镜域 · 继续本回合',
  'tactical-copy.reflection-active-shift-and-strike-the-other': '反射中 · 切换镜域，攻击另一位双子',
  'tactical-copy.return-a-spell-with-an-hourglass-to': '先启动沙漏，转送一道法术，解除护罩',
  'tactical-copy.strike-landed-damage': '攻击命中 · 造成 {p0} 点伤害',
  'tactical-copy.web-cleared-lane-open': '蛛网已清除 · 路线开放',
  'tactical-template.ap-left': '剩余 {p0} 点',
  'tactical-template.battle-reference': '战斗说明',
  'tactical-template.prime-core-1-ap': '启动核心 · 1 点',
  'tactical-template.replay-arrival': '重看开场',
  'tactical-template.shift-realm-1-ap': '切换镜域 · 1 点',
  'templates.learn-to-play': '新手教学',
  'title-copy.attack-1-against-a-boss-at-half': 'Boss 生命不高于一半时，攻击 +1。',
  'title-copy.attack-1-while-your-health-is-at': '自身生命不高于一半时，攻击 +1。',
  'title-copy.attack-2-against-the-brood-queen-while': '育巢女王仍有巢穴时，攻击 +2。',
  'title-copy.attack-2-while-the-magnetic-knight-is': '磁力骑士破甲期间，攻击 +2。',
  'title-copy.completing-your-profession-skill-in-battle-refunds':
    'Boss 战成功使用职业技能返还 1 点行动力，上限 5，每层一次。',
  'title-copy.completing-your-profession-skill-restores-1-health':
    '成功使用职业技能恢复 1 点生命，每层一次。',
  'title-copy.defense-1-in-the-brood-queen-battle': '育巢女王战中，防御 +1。',
  'title-copy.defense-1-while-braced': '防守时，防御 +1。',
  'title-copy.defense-1-while-your-health-is-at': '自身生命不高于三分之一时，防御 +1。',
  'title-copy.depart-with-1-extra-probe-up-to': '出发时额外携带 1 个探针，上限 4。',
  'title-copy.depart-with-1-extra-scanner-up-to': '出发时额外携带 1 个扫描器，上限 4。',
  'title-copy.entering-floors-4-and-7-each-adds':
    '进入第 4、7 层时，生命上限各 +1，并恢复 1 点生命。',
  'title-copy.every-third-boss-turn-starts-with-1':
    'Boss 战每逢第 3 的倍数回合，行动力 +1，上限 5。',
  'title-copy.gain-1-shield-when-entering-a-boss': '进入 Boss 房获得 1 层护盾，上限 2 层。',
  'title-copy.maximum-health-1-for-this-expedition': '本次远征生命上限 +1。',
  'title-copy.recover-2-health-when-entering-a-boss': '进入 Boss 房恢复 2 点生命。',
  'title-copy.the-first-chest-each-floor-restores-1': '每层收集的第一个宝箱恢复 1 点生命。',
  'title-copy.the-first-turn-of-each-boss-battle': '每场 Boss 战首回合行动力 +1，上限 5。',
  'title-copy.the-first-two-chests-of-the-expedition':
    '本次远征前两个宝箱各补充 1 个探针，上限 4。',
  'title-copy.the-third-chest-of-the-expedition-grants':
    '本次远征第三个宝箱补充 1 个扫描器，上限 4。',
  'title-copy.with-3-or-more-relics-reward-offers':
    '持有至少 3 件遗物时，奖励多 1 个候选，上限 5。',
  'title-copy.with-fewer-than-3-relics-reward-offers':
    '持有不足 3 件遗物时，奖励多 1 个候选，上限 5。',
  'title-template.changes-apply-next-departure': '更换后，下次出发生效。',
  'title-template.choose-a-title': '佩戴称号',
  'title-template.earn-titles-through-achievements': '完成成就获得称号。',
  'title-template.expedition-title': '远征称号',
  'title-template.no-title': '不佩戴',
  'title-template.no-titles-earned-yet': '还未获得称号',
  'title-template.this-expedition': '本局称号',
  'tutorial-lessons.a-probe-looks-ahead': '探针替你先看一眼',
  'tutorial-lessons.a-quiet-first-step': '先翻开一小片土地',
  'tutorial-lessons.alternate-between-local-clues-and-proven-mines':
    '局部数字与另一盘确认的雷，可以交替提供线索。记住：未经数字验证的旗子，仍然只是猜测。',
  'tutorial-lessons.bring-the-discovery-across': '把发现带到另一块棋盘',
  'tutorial-lessons.choose-when-to-descend': '准备好了，再下楼',
  'tutorial-lessons.classic-first-field': '标准扫雷 · 第一片雷区',
  'tutorial-lessons.clear-the-blur': '用声呐看清数字',
  'tutorial-lessons.cycle-to-quick-open-you-will-pass':
    '继续点击切换按钮，直到「快速开格」。中间的「标安全」只记录你的猜测。快速开格会在旗数与数字一致时，打开剩余邻格。',
  'tutorial-lessons.expedition-leave-camp': '远征 · 第一次出发',
  'tutorial-lessons.explore-from-your-route': '沿着已知路线开路',
  'tutorial-lessons.finish-with-confidence': '最后一步，交给推理',
  'tutorial-lessons.flag-the-glowing-covered-square-a-flag':
    '给发光的未开格插旗。旗子只是你留下的判断，不会替你探雷；这一次，我们是根据数字才确认它的。',
  'tutorial-lessons.keep-both-boards-in-view': '两边都要照顾到',
  'tutorial-lessons.leave-a-reliable-mark': '把推理结果记下来',
  'tutorial-lessons.make-a-second-deduction': '再推理一次',
  'tutorial-lessons.most-numbered-squares-are-obscured-select-sonar':
    '多数数字被模糊标记遮住。先点声呐，再点发光格：中心格会直接揭开；若是地雷则变成金旗，不会引爆，同时得到周围 3 × 3 的总雷数。范围内的数字会永久清晰，未翻开的其他格子仍需自己挖开。',
  'tutorial-lessons.move-to-the-glowing-open-square-your':
    '点击发光的已开格，走过去。角色只能沿已知安全路线移动。普通楼层没有回合倒计时，也不消耗行动点。',
  'tutorial-lessons.one-button-four-actions': '一个按钮，切换操作',
  'tutorial-lessons.open-a-safe-neighborhood': '一次翻开周围',
  'tutorial-lessons.open-the-glowing-square-empty-ground-opens':
    '点一下发光的格子。空白会连成一片打开，遇到数字便停下。',
  'tutorial-lessons.open-the-matching-glowing-square-on-b':
    '翻开 B 盘上对应的发光格。传递过去的是推理，不是数字；每块棋盘的数字仍只统计自己周围的雷。',
  'tutorial-lessons.open-the-route': '先打开通路',
  'tutorial-lessons.press-the-action-button-once-to-select':
    '点一下操作按钮，切换到「插旗」。电脑也可以直接右键格子；触屏可以长按；键盘把焦点移到格子后按 F。',
  'tutorial-lessons.quick-open-this-1-its-flagged-neighbor':
    '快速翻开这个「1」周围的格子。旁边的旗已经对应了那颗雷，下面的未开格就可以安全打开。',
  'tutorial-lessons.reach-the-treasure': '宝箱要走过去才能拿到',
  'tutorial-lessons.read-the-neighborhood': '数字说的是周围八格',
  'tutorial-lessons.reveal-this-frontier-square-your-explorer-first':
    '翻开发光的边界格。角色会先沿安全路线靠近，再挖开它。远处的未开格，必须先有一条能走到它邻边的路。',
  'tutorial-lessons.select-the-matching-flag-on-a-once':
    '再点一下 A 盘那面旗，看看两边对应位置的高亮。两块棋盘的安全格都翻完才算胜利；任意一边踩雷，这一局都会结束。',
  'tutorial-lessons.select-the-probe-then-the-glowing-square':
    '先选择探针，再点发光格。探针能侦察指定位置的 3×3 区域，不会把角色送过去。无效或重复的目标不会扣次数。',
  'tutorial-lessons.select-the-scanner-then-any-glowing-square':
    '选择扫描器，再点最后一行的发光格。它会确认这一行的雷与安全位置。两件道具的剩余次数，都会显示在技能栏上。',
  'tutorial-lessons.select-the-stairs-deliberately-to-leave-the':
    '确认准备好后，主动点击楼梯离开。生命会跨层保留：踩雷伤害为 5，一层护盾最多挡 5。BOSS 房才使用行动点，开场时可以留意它们的言行。',
  'tutorial-lessons.select-this-1-to-inspect-its-eight':
    '点一下这个「1」，看看它周围的八个位置。除了右边那个未开格，其他邻格已经安全，因此那一格就是这颗雷。',
  'tutorial-lessons.sonar-read-the-echoes': '声呐 · 听清雷区',
  'tutorial-lessons.start-with-3-pulses-four-successful-safe':
    '开局有 3 次扫描。每安全挖开 4 次补 1 次，空白连开只算一次，重复点击和插旗不算。已扫描的读数随时可看。',
  'tutorial-lessons.survey-a-whole-row': '扫描一整行',
  'tutorial-lessons.test-the-other-side': '亲手验证另一面',
  'tutorial-lessons.the-revealed-1-diagonally-above-right-of':
    '这个格子右上方的「1」，只剩它一个未知邻格。再标出这一颗雷。不用赶时间，先把判断做准确。',
  'tutorial-lessons.the-two-boards-never-have-mines-at':
    '两块棋盘的同一个坐标，不会同时埋雷。你在 A 盘确认的雷，意味着 B 盘同一位置一定安全。先把操作切回「翻开」。',
  'tutorial-lessons.twin-two-sides-of-a-clue': '双生扫雷 · 同一坐标的另一面',
  'tutorial-lessons.use-explorer-s-light-it-surveys-the':
    '使用探路灯，侦察身边的 3×3 区域，每层只能完成一次。确认的雷会锁定标记；确认安全的格子仍需要亲手翻开。职业技能就在底部技能栏里。',
  'tutorial-lessons.use-quick-open-on-this-1-its':
    '在发光的「1」上使用快速开格。它旁边的雷已标出，剩下的邻格就安全了。翻开全部安全格即获胜，不要求给每颗雷都插旗。',
  'tutorial-lessons.walk-to-the-glowing-chest-to-collect':
    '走到发光的宝箱上领取它。看见宝箱不等于已经拿到；之后获得的遗物，会收在可以展开的遗物菜单里。',
  'tutorial-lessons.you-are-on-the-board': '这一次，你也在棋盘上',
  'tutorial-lessons.you-can-move-scout-collect-and-descend':
    '现在你会移动、侦察、收集和下楼了。正式远征中，清层后选择遗物，留意生命，也可以选择撤退回营。',
  'tutorial-lessons.you-read-clues-marked-mines-and-opened':
    '你已经完成了读数字、插旗和快速开格。正式对局中，错旗会让快速开格变得危险。拿不准时，停下来重新检查数字。',
  'tutorial-lessons.your-profession-has-a-skill': '试试职业技能',
  'tutorial-player.back-to-game': '返回游戏',
  'tutorial-player.chests': '宝箱',
  'tutorial-player.click-tap-arrows-enter': '点击 / 轻触 · 方向键 + 回车',
  'tutorial-player.column': '列',
  'tutorial-player.continue': '继续',
  'tutorial-player.covered': '未开',
  'tutorial-player.exit-practice': '退出练习',
  'tutorial-player.flag': '旗',
  'tutorial-player.good-continue-when-you-are-ready': '完成了。准备好后再继续。',
  'tutorial-player.learn-by-doing': '亲手试一试',
  'tutorial-player.light': '探路灯',
  'tutorial-player.practice-field': '练习雷区',
  'tutorial-player.probe': '探针',
  'tutorial-player.ready-for-the-field': '可以正式出发了',
  'tutorial-player.row': '行',
  'tutorial-player.scan': '扫描器',
  'tutorial-player.sonar': '声呐',
  'tutorial-player.start-again': '重新练习',
  'tutorial-player.try-here': '试试这里',
  'tutorial-player.try-the-highlighted-action-first-nothing-was':
    '先试试发光提示的操作。这次没有消耗任何资源。',
  'variant-app.battle-reference': '战斗说明',
  'variant-copy.1-loadout-point-starting-probes-1': '装备预算 1 点。初始探针 +1。',
  'variant-copy.1-loadout-point-starting-scans-1': '装备预算 1 点。初始扫描 +1。',
  'variant-copy.1-probe-1-scan-1-shield': '1 探针 · 1 扫描 · 1 护盾',
  'variant-copy.1-probe-1-shield-each-floor-1': '1 探针 · 1 护盾 · 每层：1 护盾 → 5×5 侦察',
  'variant-copy.1-probe-2-scans': '1 探针 · 2 扫描',
  'variant-copy.1-probe-on-each-new-floor-up': '每次进入新层 +1 探针，上限 4。',
  'variant-copy.1-probe-scout-a-chest-each-floor': '1 探针 · 每层侦察一个宝箱 · 遗物最多四选一',
  'variant-copy.1-scan-on-each-new-floor-up': '每次进入新层 +1 扫描，上限 4。',
  'variant-copy.2-loadout-points-starting-shields-1': '装备预算 2 点。初始护盾 +1。',
  'variant-copy.2-probes-1-scan': '2 探针 · 1 扫描',
  'variant-copy.2-shields-each-floor-1-shield-1': '2 护盾 · 每层：1 护盾 → 1 探针 + 1 扫描',
  'variant-copy.abyss': '深渊',
  'variant-copy.abyss-hourglass': '深渊沙漏',
  'variant-copy.achievement-exclusive-clear-50-floors-and-claim':
    '成就专属：通过 50 层后领取「裂隙先驱」。初始 2 探针。',
  'variant-copy.achievement-exclusive-confirm-5-unique-mines-in':
    '成就专属。每层确认 5 颗不同的雷后，获得 1 探针和 1 扫描，每层一次，各上限 4。',
  'variant-copy.achievement-exclusive-the-first-chest-collected-each':
    '成就专属。每层首次拾取宝箱获得 1 层护盾，上限 2。',
  'variant-copy.add-exit-compass-and-salvage-seal-to': '将出口罗盘与回收印记加入后续遗物池。',
  'variant-copy.advanced': '进阶',
  'variant-copy.aegis': '庇护',
  'variant-copy.alchemist': '炼金术师',
  'variant-copy.an-incompatible-or-damaged-save-was-ignored':
    '已忽略不兼容或损坏的存档；可恢复的营地历史会保留。',
  'variant-copy.archaeologist': '考古学家',
  'variant-copy.arrows-home-end-move-focus-enter-space':
    '方向键 / Home / End 移动光标；Enter / 空格翻开；F、右键或触屏长按插旗。也可选择插旗模式后点击格子。',
  'variant-copy.at-each-coordinate-at-most-one-board':
    '同一坐标最多只有一张棋盘有雷。在 A 盘推理确认有雷，就能确定 B 盘对应格安全；两边都安全也可能。插旗不等于证明。翻开两盘所有安全格获胜，任一盘踩雷整局结束。首次翻开会同时打开两盘的安全邻域。',
  'variant-copy.banked-supplies': '带回物资',
  'variant-copy.base-camp': '营地',
  'variant-copy.base-settlement': '基础结算',
  'variant-copy.begin-expedition': '出发远征',
  'variant-copy.camp-and-results-preserved-the-previous-dungeon':
    '营地成长与成绩已保留；地图更新后，旧版未完成远征已返回营地。',
  'variant-copy.camp-facilities': '营地建设',
  'variant-copy.chest-beacon': '寻宝信标',
  'variant-copy.choose-a-relic': '选择遗物',
  'variant-copy.choose-one-relic-for-the-next-floor': '选择一件遗物，进入下一层',
  'variant-copy.choose-the-first-opening-on-either-board': '在任一棋盘选择首次翻开的位置。',
  'variant-copy.choose-your-difficulty-and-expedition-length-build':
    '选择难度与远征层数，遗物逐层成型。撤离带回全部战利品，失败保留一半，通关另有奖励。用物资解锁职业与三点预算的初始装备。成长增加策略选择，地雷仍然危险。',
  'variant-copy.classic': '标准扫雷',
  'variant-copy.click-revealed-floor-to-walk-there-along':
    '点击已揭示地板，角色沿已知安全路线自动寻路；点击高亮前沿，会先走近再探索。走到宝箱才能收取奖励。点击楼梯并抵达后，选择遗物进入下一层。所有安全地板上下左右连通，孤立区域会成为墙壁；数字仍统计周围八格。蓝旗是手动猜测，金旗是已确认的雷，无法取消。每层从变化的内圈入口出发，开局是带有效线索的小型不规则区域。',
  'variant-copy.collect-a-chest-to-scout-the-next':
    '拾取宝箱后侦察下一个未拾取宝箱周围 3×3，每层一次；不自动拾取。',
  'variant-copy.collected': '已收集',
  'variant-copy.completed-expeditions': '远征通关',
  'variant-copy.completing-a-profession-skill-scouts-your-landing':
    '完成职业技能后侦察落点所在整行，每层一次；仅放置回撤锚点不触发。',
  'variant-copy.confirm-4-distinct-mines-in-a-floor':
    '每层确认 4 颗不同地雷后侦察出口周围 3×3，每层一次；不会开启出口或跳过守卫。',
  'variant-copy.confirm-8-distinct-mines-in-a-floor':
    '每层确认 8 颗不同地雷后回复 2 点生命，不超过生命上限，每层一次。',
  'variant-copy.confirmed-mine-locked-flag': '确认有雷 · 标记已锁定',
  'variant-copy.confirmed-safe': '已确认安全',
  'variant-copy.continue-to-next-floor': '进入下一层',
  'variant-copy.difficulty': '难度',
  'variant-copy.difficulty-bonus': '难度加成',
  'variant-copy.difficulty-reward': '难度奖励',
  'variant-copy.drag-a-tool-onto-the-board-or': '将道具拖到棋盘，或选中后点击目标。',
  'variant-copy.end-this-expedition-and-bank-all-collected': '结束本次远征，带回全部已收集战利品？',
  'variant-copy.engineer': '工兵',
  'variant-copy.entrance': '入口',
  'variant-copy.exit': '出口',
  'variant-copy.exit-compass': '出口罗盘',
  'variant-copy.expedition': '远征',
  'variant-copy.expedition-complete': '远征通关',
  'variant-copy.expedition-ended': '远征失败',
  'variant-copy.expert': '专家',
  'variant-copy.explorer': '探险者',
  'variant-copy.explorer-2': '探险家',
  'variant-copy.extract-to-camp': '撤离回营地',
  'variant-copy.fault-map': '断层图谱',
  'variant-copy.field-radio': '野战电台',
  'variant-copy.find-a-safe-route-to-the-exit': '推理出通往出口的安全路线。',
  'variant-copy.find-your-first-relic-after-floor-one': '通过第一层后获得首件遗物。',
  'variant-copy.fit-board': '适应面板',
  'variant-copy.floor': '层数',
  'variant-copy.floor-cleared': '本层已通关',
  'variant-copy.future-treasures-give-9-supplies-instead-of': '此后每个宝箱收益从 6 提升至 9。',
  'variant-copy.gain-1-shield-up-to-2-absorbs':
    '获得 1 层护盾，上限 2 层。抵挡最多 5 点伤害；踩中的雷留下不可取消的红色地雷标记。',
  'variant-copy.game-mode': '玩法模式',
  'variant-copy.game-updated-your-expedition-returned-to-camp':
    '游戏已更新，远征已返回营地，带回 {p0} 物资。营地成长已保留。',
  'variant-copy.guard': '护盾',
  'variant-copy.health': '生命',
  'variant-copy.hunter-seal': '猎手印记',
  'variant-copy.inspect-a-3-3-area-gold-flags': '探测目标周围 3×3：金旗标记地雷，绿点标记安全格。',
  'variant-copy.inspect-a-whole-row-gold-flags-mark': '扫描整行：金旗标记地雷，绿点标记安全格。',
  'variant-copy.keep-75-of-collected-loot-on-defeat': '失败保留收益从 50% 提升至 75%。',
  'variant-copy.lantern': '提灯',
  'variant-copy.larger-cells': '放大格子',
  'variant-copy.last-bastion': '绝境壁垒',
  'variant-copy.loadout-3-points': '出发装备 · 3 点预算',
  'variant-copy.matching-coordinate': '对应坐标',
  'variant-copy.mines-total': '地雷总数',
  'variant-copy.mission-exclusive-1-loadout-point-a-successful':
    '任务专属 · 装备预算 1 点。成功使用职业技能后补充 1 探针，上限 4，每层一次。',
  'variant-copy.mission-exclusive-clear-12-floors-and-claim':
    '任务专属：通过 12 层后领取「归途有记」。初始 1 探针、1 扫描。',
  'variant-copy.moves': '操作数',
  'variant-copy.original-rules': '原版规则',
  'variant-copy.partner-cleared-flagged-mines-there-are-now':
    '另一盘已完成：其中的雷标记现已确认。',
  'variant-copy.probe-3-3-area': '探测 3×3 区域',
  'variant-copy.probe-found-count-mines': '探测发现 {count} 枚雷。',
  'variant-copy.probe-kit': '探针包',
  'variant-copy.probes': '探针',
  'variant-copy.profession': '职业',
  'variant-copy.pulse-coil': '脉冲线圈',
  'variant-copy.reachable-frontier': '可探索前沿',
  'variant-copy.recent-results-this-mode': '近期记录 · 当前模式',
  'variant-copy.relaxed': '轻松',
  'variant-copy.relic-archive': '遗物档案馆',
  'variant-copy.relic-build': '遗物搭配',
  'variant-copy.revive-at-3-hp-and-scout-your':
    '致命伤害后以 3 点生命复起，并侦察周围 3×3，每局一次；已有回生符优先触发，保留沙漏次数。',
  'variant-copy.riftwalker': '裂隙师',
  'variant-copy.run-loot': '本局战利品',
  'variant-copy.safely-extracted': '成功撤离',
  'variant-copy.salvage-seal': '回收印记',
  'variant-copy.scan-a-row': '扫描一行',
  'variant-copy.scanner': '扫描仪',
  'variant-copy.scans': '扫描',
  'variant-copy.scout-the-exit-s-3-3-area': '每层侦察出口周围 3×3，揭开安全格并标记地雷。',
  'variant-copy.scroll-or-swipe-to-explore-the-enlarged': '滚动或滑动查看放大的棋盘。',
  'variant-copy.sentinel': '哨卫',
  'variant-copy.shields': '护盾',
  'variant-copy.stairs-reachable-click-them-when-ready-to':
    '楼梯已连通 · 准备好后点击楼梯前往下一层。',
  'variant-copy.standard': '标准',
  'variant-copy.supplies': '物资',
  'variant-copy.survey-lens': '测绘透镜',
  'variant-copy.survey-token': '勘探信物',
  'variant-copy.surveyor': '测绘师',
  'variant-copy.survive-health-damage-with-2-hp-or':
    '承受生命伤害后存活且生命不超过 2，护盾补至 2；每局一次，不提供复活。',
  'variant-copy.this-run-reached-the-move-limit-extract':
    '本局已达操作上限，请撤离或重新开始双盘。',
  'variant-copy.trail-heart': '远行之心',
  'variant-copy.treasure-pouch': '藏宝袋',
  'variant-copy.treasure-safe': '宝箱 · 安全格',
  'variant-copy.triggered-mine': '已踩雷',
  'variant-copy.twin-boards': '双生棋盘',
  'variant-copy.unlock-at-camp': '需要营地解锁',
  'variant-copy.unlock-departure-equipment-choose-up-to-3': '解锁初始装备，每局最多携带 3 点。',
  'variant-copy.unlocked': '已解锁',
  'variant-copy.used-this-expedition': '本局已触发',
  'variant-copy.used-this-floor': '本层已触发',
  'variant-copy.used-this-turn': '本回合已触发',
  'variant-copy.view-results': '查看结算',
  'variant-copy.wall-impassable': '墙壁 · 无法通行',
  'variant-copy.waymarker': '锚行者',
  'variant-copy.workshop': '工坊',
  'variant-copy.your-story-starts-here': '从这里写下第一段旅程。',
  'variant-view.resonator-four-turn-core-windows': '共鸣机关 · 核心窗口延长至 4 回合',
  'variant-view.return-anchor': '回撤锚点',
  'variant-view.rift-landing': '裂隙落点',
  'variant-view.suppressor-lowers-future-attacks-to-3': '抑制机关 · 后续攻击降至 3 点',
  'variant-view.two-way-rift': '双向裂隙',
}
