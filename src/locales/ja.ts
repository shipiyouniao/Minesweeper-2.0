import type { MessageCatalog } from '../types/message-catalog.js'

/** ja interface messages. Keep keys aligned across locales. */
export const jaMessages: MessageCatalog = {
  'survey.mines': '地雷',
  'survey.title': '測量',
  'survey.intro': '地雷の連なりを、縦横から読み解く。',
  'survey.opening': '長い連なりや、ぴったり埋まる列から始めよう。',
  'survey.legend': '連続する地雷の数',
  'survey.hint': '縦横のヒントから安全なマスを開こう。',
  'survey.bookkeeping': '「2 1」は地雷2個、空白を挟んで1個。旗を間違えると地雷を踏むことも。',
  'survey.line': '{axis} {number}：連なり {runs} · 旗 {flags}',
  'survey.moves': '操作数',
  'survey.remaining': '残りの安全マス',
  'survey.zoom': 'マスを拡大',
  'survey.fit': '盤面に合わせる',
  'survey.win': '測量完了',
  'survey.loss': '測量中に地雷を踏んだ',
  'survey.rank-hint': '難易度別に、少ない操作数で記録。',
  'survey.no-records': '測量を完了すると記録が残ります。',
  'survey.recovered': '新しい盤面を用意しました。現行ルールの記録だけを引き継ぎます。',
  'survey.limit': '操作数の上限に達しました。新しい盤面を始めてください。',
  'survey.chord': '連なりの旗が揃った行・列と、安全メモのマスをまとめて開く。',
  'survey.lesson-title': '測量 · 連なりを読む',
  'survey.lesson-overlap-title': '重なる位置を探す',
  'survey.lesson-overlap':
    '1行目は5マス中、地雷が3個連続。どこに置いても中央を通ります。中央に旗を立てよう。',
  'survey.lesson-column-title': '縦横をつなぐ',
  'survey.lesson-column': '2列目の「5」は全マスが地雷。1行目との交点に旗を立てよう。',
  'survey.lesson-column-right': '4列目も「5」。交点に旗を立てると、1行目の3個が揃います。',
  'survey.lesson-chord-title': '揃った行を開く',
  'survey.lesson-chord-mode': '下の操作ボタンで「まとめて開く」に切り替えよう。',
  'survey.lesson-chord': '光っている旗を選ぼう。1行目の地雷は揃ったので、両端をまとめて開けます。',
  'survey.lesson-gap-title': '連なりの間を空ける',
  'survey.lesson-reveal-mode': '操作ボタンを「開く」に戻そう。',
  'survey.lesson-gap':
    '中央の行は「2 2」。地雷2個、空白1マス、地雷2個でぴったり。中央の空白を開こう。',
  'survey.lesson-ending': '順番と間隔を読み、縦横で確かめよう。安全なマスをすべて開けば完了。',
  'echo.shifted': '本体が移動した。古い本体の観測は無効。再スキャンしよう。',
  'echo.phase-break': '殻を破壊した。ターン終了時に本体が移動する。',
  'echo.rhythm': '隙は3ターン。3ターンごとに音波が止むので、移動や攻撃の好機。',

  'echo.hunt': '残響討伐',
  'echo.hunt-note': '残響の番人を倒す。',
  'echo.flawless': '無音の足取り',
  'echo.flawless-note': '体力を失わずに残響の番人を倒す。',
  'echo.precise': '絶対音感',
  'echo.precise-note': 'ソナーを6回以内で残響の番人を倒す。',
  'echo.flawless-effect': '体力が満タンの間、防御+1。',
  'echo.precise-effect': '残響の番人の殻が開いている間、攻撃+1。',

  'echo.scene-0': '三つの声、一つの鼓動',
  'echo.scene-1': '三体の銅像が静止している。足音が三方向から響き、床の刻印まで揺らいで見える。',
  'echo.scene-2': '選べ。ほかの二つの体も、お前の刃を待っている。',
  'echo.scene-3': 'どれも同じ音だ……でも残響が止む間に、一か所だけまだ鳴っている。',
  'echo.scene-4':
    '踊り場の小さな装置が澄んだ音を返した。淡い緑の継ぎ目が足元から部屋へ伸びている。',
  'echo.scene-5': 'これなら聞き分けられる。調べた側が静かなら候補から外して、もう一方を試せる。',
  'echo.scene-6': '聞き入っていると、次の音はお前の体を貫くぞ。',
  'echo.scene-7': '床の継ぎ目が赤く光る。三体が同時に大きく息を吸い込んだ。',
  'echo.scene-8':
    '鳴り続ける本体を探し、近づいてこじ開けよう。音波が来る前に逃げ道も確保しないと。',

  'echo.locate': '共鳴体をスキャンして本体を絞り込もう。',
  'echo.shell': '本体を特定し、近づいてクリックすると殻が開く。',
  'echo.fight': '隙を狙って攻撃し、ターン終了前に赤い音波の範囲から逃れよう。',
  'echo.loan': '貸出ソナー · {charges}/3 · 充電 {progress}/4',
  'echo.body': '共鳴体 {body}',
  'echo.candidates': '本体の候補：{bodies}',
  'echo.obscured': '不鮮明な数字',
  'echo.reading': '{row}行{column}列 · 地雷{mines}個',
  'echo.present': '範囲内に本体あり',
  'echo.absent': '範囲内に本体なし',
  'echo.stale': '過去の段階',
  'echo.phase-note':
    '体力の区切りごとに本体が移動し、貸出ソナーは最低2回に補充。古い本体の観測は無効。',

  'sonar-equipment.name': 'ソナー',
  'sonar-equipment.note':
    '装備枠1 · 初期2回、安全な掘削12回で1回回復（上限3）。3×3の地雷総数と数字を明らかにし、中心だけを開く。',
  'echo.name': '残響の番人',
  'echo.status': '段階 {phase}/3 · 隙はあと{window}ターン',

  'battle-guide.approach-a-revealed-hourglass-and-return-a':
    '開いた砂時計に接近。術を返送して障壁を解除。',
  'battle-guide.approach-the-core-and-activate-it-to': 'コアに接近して起動し、攻撃の隙を作る。',
  'battle-guide.clear-eggs-before-they-hatch-and-avoid': '卵は孵化前に除去可能。攻撃予告を避ける。',
  'battle-guide.compare-the-boards-a-mine-on-one': '両盤面を比較。一方が地雷なら他方は安全。',
  'battle-guide.disable-a-seal-to-expose-the-twin': 'こちらの封印を解除し、反対側の双子を攻撃。',
  'battle-guide.fewer-nests-mean-less-armor-and-healing':
    '巣が減ると防護と回復も低下。接近して攻撃。',
  'battle-guide.flag-nearby-mines-and-destroy-a-nest': '巣の周囲に旗を立て、破壊して無敵を解除。',
  'battle-guide.flag-the-mines-around-both-pylons-then': '両方の塔の周囲に旗を立て、塔を停止。',
  'battle-guide.full-rules': '詳しいルール',
  'battle-guide.leave-the-marked-cells-before-the-countdown':
    '残りターンを確認し、発動前に印から退避。',
  'battle-guide.move-1-cell-reveal-1-strike-2': '移動1/マス · 開く+1 · 攻撃2 · 防御1 · 旗0',
  'battle-guide.open-a-route-to-an-anchor-then': '錨まで道を開き、起動してボスを誘導。',
  'battle-guide.strike-switch-realms-strike-the-other-twin':
    '一撃ごとに転移して交互に攻撃。両側の予告を確認。',
  'battle-guide.strike-then-leave-your-echo-it-repeats':
    '攻撃後に残像から離れると、終了時に同じダメージで追撃。',
  'battle-guide.strike-while-exposed-leave-the-red-cells': '隙に攻撃。終了前に赤いマスから退避。',
  'battle-guide.the-crash-breaks-its-armor-approach-and':
    '衝突で装甲が破れる。回復前に接近して攻撃。',
  'battle-guide.three-moves-to-learn-the-fight': '3つの手順で戦い方を覚える',
  'battle-guide.use-the-preparation-turn-to-leave-the': '溜めのターンに錨の3 × 3爆発範囲から退避。',
  'battle-presentation.action-points': '行動力',
  'battle-presentation.approach-and-prime-the-core-1-ap': '接近してコア起動 · 1',
  'battle-presentation.attack': '攻撃',
  'battle-presentation.base-5-attack-0-defense-3-ap': '基本：攻撃5・防御0・行動力3',
  'battle-presentation.base-stats-10-health-5-attack-0':
    '基本は体力10・攻撃5・防御0・行動力3。装備と遺物の補正は戦闘パネルで確認。移動1マス1、開くと追加1、攻撃2、他は1。旗は無料。',
  'battle-presentation.bastion-guardian': '城塞の守護者',
  'battle-presentation.boss-defeated-full-health-1-shield': 'ボス撃破 · 体力全回復、シールド+1',
  'battle-presentation.brace-1-ap': '防御 · 1',
  'battle-presentation.brace-reduces-this-turn-s-enemy-damage':
    '防御操作は今ターンの敵ダメージを3軽減。防具も軽減するが、命中は最低1、その後シールドで吸収。地雷と調整失敗は防具を無視して5。シールド1つで最大5吸収。勝利で全回復とシールド1。',
  'battle-presentation.brood-queen': '育巣の女王',
  'battle-presentation.build-effects': '構成の効果',
  'battle-presentation.control-disabled': '装置停止',
  'battle-presentation.control-reveal-and-flag-neighboring-mines':
    '装置 · 開いて周囲の地雷をマーク',
  'battle-presentation.controls-2': '装置 {p0}/2',
  'battle-presentation.core-exposed': 'コア露出',
  'battle-presentation.core-open-turns': 'コア露出 · 残り{p0}ターン',
  'battle-presentation.defense': '防御',
  'battle-presentation.defenses': '防御装置',
  'battle-presentation.each-nest-gives-3-armor-and-heals':
    '巣1つにつき防護3・毎ターン体力3回復。破壊すると補充停止、女王に3ダメージ。3巣健在なら直接攻撃不可。全破壊で回復停止、女王は2ターンごとに攻撃。',
  'battle-presentation.eggs-hatch-after-two-turns-hatchlings-advance':
    '卵は2ターンで孵化。幼体は安全経路を最大2マス進み、残像が予定位置を示す。幼体は各3、女王は5ダメージ、重複分は加算。倒した幼体の予告は消える。卵と幼体は合計3まで。',
  'battle-presentation.end-turn': 'ターン終了',
  'battle-presentation.enemy-attack-forecast': '敵の攻撃予告',
  'battle-presentation.nests-3-armor-regen': '巣 {p0}/3 · 防護 {p1} · 回復 {p1}',
  'battle-presentation.reveal-each-control-and-flag-its-neighboring':
    '装置を開き周囲の地雷に旗を立てる。2基を停止し、隣接してコアを起動、露出中に攻撃。',
  'battle-presentation.reveal-nests-and-flag-their-neighboring-mines':
    '巣を開き周囲の地雷に旗を立て、接近して破壊。残った巣は女王を回復・防護する。',
  'battle-presentation.row-column-and-cross-attacks-remain-fixed':
    '横列・縦列・十字の予告はターン終了まで固定。装置を止める順番で接近中の軽減と露出時間が変わる。',
  'battle-presentation.scout-the-nearest-active-objective-with-undiscovered':
    '未確認情報のある最寄りの稼働装置や巣を偵察。',
  'battle-presentation.strike-2-ap': '攻撃 · 2',
  'battle-presentation.the-amber-control-reduces-future-attacks-from':
    '琥珀装置は以後の攻撃を5から3に軽減。青い装置は露出を4ターンに延長。2基停止後、隣接した閉じたコアを1行動力で起動。終了後も再起動可能。',
  'battle-presentation.turn': 'ターン',
  'battle-presentation.turn-ap': 'ターン行動力',
  'board-controls.chord':
    '開いたマスを押して周囲の安全印を掘ります。旗数が合えば未確定のマスも開きます。',
  'board-controls.flag': '未開封のマスを押して旗を立て、もう一度押すと解除。',
  'board-controls.gestures': '右クリック / 長押し：印を切り替え、周囲を開きます。',
  'board-controls.label': '盤面の操作',
  'board-controls.reveal': 'マスを押して開きます。遠征では開いたマスへ移動できます。',
  'board-controls.safe': '未開封のマスを押して安全メモ、もう一度押すと解除。',
  'board-controls.tap-to-cycle': '押して切替',
  'board-help.chord':
    '開いたマスを右クリック・長押しすると、周囲の安全メモと安全確認済みマスを掘ります。旗数が合えば他の隣接マスも開きます。「周囲を開く」ボタンも使えます。誤った印は地雷を踏む原因になります。',
  'board-help.edge':
    'Edge 内蔵のジェスチャーはブラウザー側の機能です。右ドラッグでページが移動する場合、Edge の設定で「マウス ジェスチャ」を検索して無効にできます。',
  'board-help.expeditionChord':
    '既知の道を通って順番に掘ります。ボス戦では行動ポイントを消費し、届かないマスは安全メモに。地雷を踏むと停止。C の後はカーソルがキャラクターを追います。',
  'board-help.extensions': 'キーボード・マウス拡張機能',
  'board-help.gestures':
    '右ボタンを離すと操作、ドラッグすると取消。ブラウザーのジェスチャーが動く場合はこのサイトで無効にするか、盤面の操作ボタンを使ってください。',
  'board-help.keyboard':
    '矢印 / H J K L でカーソル移動。Enter / Space で選択中の操作、F で旗、S で安全メモ、C で周囲を開きます。',
  'board-help.known': '金の旗は地雷確定、緑の点は安全確認済み。確認結果は手動で解除できません。',
  'board-help.note':
    '未開封のマスを右クリック・長押しすると旗→安全メモ→解除。「安全メモ」ボタンを選んで押すこともできます。地雷の可能性は残ります。',
  'board-help.triggered': '赤い地雷は踏んだ場所です。シールドで防いでも記録され、地雷は残ります。',
  'board-help.vimium':
    'Vimium は i でキーをページへ渡すか、このサイトを除外してください。Esc で透過モードを終了します。',
  'boss-prologue.at-the-threshold': '境界にて',
  'boss-prologue.continue': '次へ',
  'boss-prologue.enter-battle': '戦闘へ',
  'boss-prologue.explorer': '訪問者',
  'boss-prologue.label': '（{p0}）',
  'boss-prologue.previous': '戻る',
  'boss-prologue.skip-arrival': '登場をスキップ',
  'boss-scripts.a-buried-anchor-answers-the-pulse-with':
    '地中の錨が磁場に応え、低い鐘の音を返す。数字の刻まれた縁には、古い衝突の傷がある。',
  'boss-scripts.a-hunger-with-many-mouths': '多くの口、ひとつの飢え',
  'boss-scripts.a-mark-appears-beneath-your-feet-you':
    '足元に刻印が浮かぶ。半歩ずれても刻印は動かず、静かに何かを数えている。',
  'boss-scripts.a-moment-left-behind': '残された一瞬',
  'boss-scripts.a-repeated-blow-is-only-an-invitation':
    '同じ一撃を繰り返せば、跳ね返してほしいと言うようなもの。この踊りには慣れている。',
  'boss-scripts.a-seal-glows-in-the-amber-room':
    '琥珀の部屋の封印が光る。光は鏡を抜け、青い騎士を包んだ。',
  'boss-scripts.a-thread-catches-your-sleeve-then-another':
    '一本の糸が袖に絡み、また一本。奥では三つの巣が、心臓とは違う拍子で脈打っていた。',
  'boss-scripts.an-answer-on-the-other-side': '答えは向こう側',
  'boss-scripts.an-egg-rolls-from-the-nearest-nest':
    '近くの巣から卵が転がる。殻にひびが入り、女王の装甲はさらに固く閉じる。',
  'boss-scripts.bastion-guardian': '城塞の守護者',
  'boss-scripts.beyond-the-stairs-something-immense-draws-a':
    '階段の先で巨大な扉が呼吸する。部屋の両端で琥珀と青の光が交互に灯った。',
  'boss-scripts.borrow-the-enemy-s-strength': '敵の力を借りる',
  'boss-scripts.brood-queen': '育巣の女王',
  'boss-scripts.clock-mage-clepsydra': '時計の魔術師・漏刻',
  'boss-scripts.cut-the-silk-if-you-like-my':
    '糸は切ってもいいわ。子どもたちはもう、次に飛びかかる場所を決めている。',
  'boss-scripts.do-not-hurry-i-have-already-reserved':
    '急ぐな。お前が敗れる時刻は、もう取ってある。',
  'boss-scripts.even-your-footsteps-belong-to-my-field':
    'お前の足取りさえ、我が磁場の中。近づけ。さもなくば、立つ場所はこちらが選ぼう。',
  'boss-scripts.i-can-see-their-shadows-gathering-ahead':
    '着地する前に影が集まっている。道を開き、巣をひとつずつ。背後に孵りかけの卵は残さない。',
  'boss-scripts.i-hear-that-little-anchor-singing-when':
    '小さな錨の歌が聞こえる。応える時、進路に立つなよ。',
  'boss-scripts.it-has-chosen-a-place-and-a':
    '選んだのは場所と時刻で、私ではない。その前に離れれば、予言は空振りになる。',
  'boss-scripts.magnetic-knight': '磁力の騎士',
  'boss-scripts.mirror-twins': '鏡の双子',
  'boss-scripts.my-blade-rings-against-its-armor-not':
    '刃は鎧に弾かれ、傷ひとつない。でも今の脈動は、胸からではなかった。',
  'boss-scripts.my-boots-slide-before-i-lift-them':
    '足を上げる前に靴が滑る。踏ん張れば引力には耐えられるが、正面から鎧を破る力はない。',
  'boss-scripts.no-one-passes-the-walls-remember-every':
    '止まれ。この壁は、無駄に終わった一撃をすべて覚えている。',
  'boss-scripts.one-feeds-the-blows-the-other-keeps':
    '片方が攻撃を支え、もう片方が殻を保つ。数字の石を読めば、制御部まで行けそうだ。',
  'boss-scripts.quiet-feet-warm-blood-you-have-come':
    '静かな足音、温かな血。遠くから私たちを満たしに来たのね。',
  'boss-scripts.something-of-each-strike-stays-behind-and':
    '一撃の一部が過去に残る。砂時計は術と同じ光を放っている……行き先を書き換えられるかもしれない。',
  'boss-scripts.the-amber-light-brightens-the-guardian-s':
    '琥珀が光ると重い腕が上がる。青が唸ると、胸の隙間が閉じた。',
  'boss-scripts.the-door-that-learned-to-breathe': '呼吸する扉',
  'boss-scripts.the-guardian-settles-its-weight-both-lights':
    '守護者が身構え、二つの灯りが定まる。厚い鎧の奥で、小さな鼓動が待っている。',
  'boss-scripts.the-knight-closes-its-fists-for-an':
    '騎士が拳を握る。二重の鎧の隙間で、不安定な光が一瞬だけ揺れた。',
  'boss-scripts.the-last-grain-of-sand-falls-upward':
    '最後の砂粒が上へ落ちた。階段を下りても、影だけが一拍遅れてついてくる。',
  'boss-scripts.the-mirror-clears-two-paths-wait-and':
    '鏡が澄み渡る。二つの道が待ち、片方にはまだ温かな足跡が残っていた。',
  'boss-scripts.the-needle-in-your-compass-turns-sideways':
    '方位針が横を向く。床の鉄粉が生き物のように、動かない騎士へ這っていく。',
  'boss-scripts.the-nests-are-more-than-nurseries-if':
    '巣は卵を育てるだけではない。ひとつ沈黙させれば、幼体以上のものを失うはず。',
  'boss-scripts.the-pull-is-gathering-not-striking-yet':
    '力は集まりつつあるが、まだ来ない。退く時間はある。錨からも離れよう、あの石は衝撃に耐えられない。',
  'boss-scripts.the-queen-lifts-herself-from-the-floor':
    '女王が床から身を持ち上げる。その後ろで、小さな何かが殻を二度叩いた。',
  'boss-scripts.the-rooms-share-a-shape-but-not':
    '部屋の形は同じでも危険は重ならない。こちらの地雷の響きは、鏡の向こうでは静寂になる。',
  'boss-scripts.the-wound-i-made-is-closing-something':
    'つけた傷が塞がっていく。あの巣から何かが流れ込んでいる。',
  'boss-scripts.their-protection-comes-from-the-other-room':
    '守る力は反対側から来ている。ここに留まっていては、この結び目は解けない。',
  'boss-scripts.then-i-change-partners-remember-where-i':
    'なら相手を替える。両側の足場を覚え、発見を運び、同じ顔を続けて追わない。',
  'boss-scripts.then-i-will-read-the-floor-before':
    'なら、地面を読んでから進む。胸が再び開く時には、すぐそばにいなければ。',
  'boss-scripts.then-send-its-spell-back-to-shatter':
    'なら術を返して障壁を壊そう。一撃を与えて退き、残像にもう一撃任せる。',
  'boss-scripts.those-scars-it-has-been-drawn-here':
    'この傷……以前にも引き寄せられたのか。道を開いて錨を起こせば、敵の磁場を借りられそうだ。',
  'boss-scripts.touch-my-clocks-if-you-must-borrowed':
    '我が時計に触れるなら触れよ。借りた時間は、必ず誰かから取り立てる。',
  'boss-scripts.which-of-us-did-you-come-to':
    'どちらを打ちに来た？ よく考えろ。私たちは覚えている。',
  'boss-scripts.you-watch-the-lamps-instead-of-the':
    '門ではなく灯りを見るか。足元は、お前より賢い侵入者も飲み込んできた。',
  'boss-scripts.your-hand-drops-but-the-outline-it':
    '手を引いても、残った輪郭が動作を最後まで続ける。魔術師が不機嫌そうに残像を見た。',
  'boss-scripts.your-reflection-takes-one-more-step-after':
    '足を止めても、鏡の自分はもう一歩進んだ。一方の広間は琥珀色、もう一方は青い月光。',
  'brood-board.nest-destroyed': '巣は破壊済み',
  'brood-board.nest-reveal-and-flag-nearby-mines-to': '巣 · 開いて周囲の地雷に旗を立てて破壊',
  'brood-board.next-hatchling-position': '幼体の次の位置',
  'brood-copy.egg-hatches-in-turns-clear-adjacent-for': '卵 · 孵化まで{p0}ターン · 隣接除去1',
  'brood-copy.hatchling-clear-adjacent-for-1-ap': '幼体 · 隣接撃破1',
  'brood-copy.web-clear-adjacent-for-1-ap': '巣網 · 隣接除去1',
  'camp-copy.achievements': '実績',
  'camp-copy.all': 'すべて',
  'camp-copy.back-to-camp': 'キャンプへ戻る',
  'camp-copy.build-a-three-point-loadout': '3ポイントで装備を組む',
  'camp-copy.choose-board-size-and-expedition-length': '難易度と階層数を選ぶ',
  'camp-copy.choose-your-explorer-and-skill': '冒険者とスキルを選ぶ',
  'camp-copy.count-floors': '{count}階',
  'camp-copy.count-unlocked': '{count}点を解放済み',
  'camp-copy.equipment': '装備',
  'camp-copy.loadout': '出発装備',
  'camp-copy.loadout-points': '装備ポイント',
  'camp-copy.missions': 'ミッション',
  'camp-copy.need-count-more-supplies': '物資があと{count}必要',
  'camp-copy.no-equipment-selected': '装備未選択',
  'camp-copy.purchase': '購入',
  'camp-copy.ready-for-departure': '出発の準備',
  'camp-copy.relics': '遺物',
  'camp-copy.select-an-item-to-see-its-effect': '商品を選ぶと効果を確認できます。',
  'camp-copy.shop': 'ショップ',
  'camp-copy.unlock-careers-equipment-and-relics': '職業・装備・遺物を解放',
  'camp-copy.unlock-the-workshop-before-buying-and-equipping':
    '出発装備を購入・携帯するには、先に工房を解放してください。',
  'camp-template.explore-complete-goals-claim-exclusive-gear':
    '探索目標を達成し、物資と限定装備を獲得',
  'camp-template.long-term-milestones-with-lasting-rewards': '長期目標に挑み、遺物と職業を解放',
  'camp-template.ready': '受領可能',
  'clock-board.echo': '残像の追撃：{p0} · {p1}',
  'clock-board.echo-move': '移動して発動',
  'clock-board.echo-pending-damage': '残像 · 追撃ダメージ{p0}',
  'clock-board.echo-ready': '準備完了',
  'clock-board.hourglass-reveal-approach-return-earliest-spell-1':
    '砂時計 · 開いて接近、最も早い術を返送 · 1',
  'clock-board.last-turn-echo-returned-spell': '前ターン：残像{p0}、返送{p1}',
  'clock-board.spent-hourglass-walkable': '使用済み砂時計 · 通行可能',
  'clock-copy.an-adjacent-or-occupied-revealed-hourglass-returns':
    '隣接または足元の開いた砂時計で最も早い敵術を1行動力で返送。各1回、ボスに6ダメージ、次ターン新規詠唱停止。既存予告は通常通り解決。最初の返送で障壁を永久解除。それまでは攻撃不可。地雷と数字は巻き戻らない。',
  'clock-copy.barrier-return-a-spell-first': '障壁 · 先に術を返送',
  'clock-copy.clock-hand-damage-3': '時計の針 · ダメージ3',
  'clock-copy.clock-mage-clepsydra': '時計の魔術師・漏刻',
  'clock-copy.delayed-casting': '遅延詠唱',
  'clock-copy.dual-countdown': '二重カウントダウン',
  'clock-copy.each-turn-starts-with-a-walkable-echo':
    '毎ターン足元に通行可能な残像。残像のマスから移動すると、最初の有効攻撃と同じダメージで終了時に追撃、道具・スキルの追加発動なし。敵術が先に解決し、死亡時は追撃中止。',
  'clock-copy.hourglasses-3': '砂時計 {p0}/3',
  'clock-copy.in-turn-ends': '{p0}回目の終了時',
  'clock-copy.marks-deal-3-damage-after-two-turn':
    '刻印は2回終了後に3ダメージ。半分以下では3回終了後の直線攻撃を追加。重複は加算、予告は追尾しない。既知の道で回避不能な新攻撃は縮小・省略。',
  'clock-copy.recovery-no-new-spell': '回復中 · 新規詠唱なし',
  'clock-copy.return-a-spell-with-an-hourglass-to':
    '砂時計で術を返送し障壁を解除。攻撃後に退避し、残像で追撃。',
  'clock-copy.returned-spell-boss-damage-6': '返送済み · ボスに6ダメージ',
  'clock-copy.spell-returned-deadline-unchanged': '術を返送 · 期限は変化なし',
  'clock-copy.this-turn-end': '今回の終了時',
  'clock-copy.time-mark-damage-3': '時の刻印 · ダメージ3',
  'combat-build-copy.1-ap-every-combat-turn-up-to': '戦闘の各ターンで行動力+1、上限5。',
  'combat-build-copy.1-loadout-point-starting-and-maximum-health':
    '装備1ポイント。初期・最大体力+2。',
  'combat-build-copy.1-loadout-point-the-first-control-or':
    '装備1ポイント。毎ターン最初の装置・封印停止、巣破壊、錨調整で行動力1回復。',
  'combat-build-copy.1-loadout-point-the-first-web-egg':
    '装備1ポイント。毎ターン最初の巣網・卵・幼体除去で行動力1回復。',
  'combat-build-copy.2-loadout-points-1-ap-on-even': '装備2ポイント。偶数ターンの行動力+1、上限5。',
  'combat-build-copy.2-loadout-points-attack-2': '装備2ポイント。攻撃+2。',
  'combat-build-copy.2-loadout-points-defense-1-against-enemy':
    '装備2ポイント。防御+1。敵の攻撃を軽減、地雷には無効。',
  'combat-build-copy.add-attack-defense-and-action-point-relics':
    '攻撃・防御・行動力の遺物を今後の遠征報酬に追加。',
  'combat-build-copy.attack-3-for-this-expedition': 'この遠征の攻撃+3。',
  'combat-build-copy.battle-manual': '戦術教本',
  'combat-build-copy.clearing-hook': '障害除去フック',
  'combat-build-copy.defense-1-against-enemy-attacks-for-this':
    'この遠征で敵の攻撃に対する防御+1。',
  'combat-build-copy.endurance-training': '持久力訓練',
  'combat-build-copy.field-boots': '行軍ブーツ',
  'combat-build-copy.focus-lens': '調整レンズ',
  'combat-build-copy.layered-armor': '重ね鎧',
  'combat-build-copy.medical-kit': '医療キット',
  'combat-build-copy.mines-deal-5-damage-each-shield-absorbs':
    '地雷は5ダメージ。シールド1つで最大5吸収、階層突破で体力5回復。防具は敵の攻撃のみ軽減。',
  'combat-build-copy.one-purchase-only-base-attack-1-on': '購入は1回のみ。今後の基本攻撃+1。',
  'combat-build-copy.one-purchase-only-starting-and-maximum-health':
    '購入は1回のみ。今後の初期・最大体力+1。',
  'combat-build-copy.plated-vest': '鱗鎧のベスト',
  'combat-build-copy.steel-blade': '鋼の短剣',
  'combat-build-copy.tactics-hourglass': '戦術の砂時計',
  'combat-build-copy.tempered-edge': '焼入れの刃',
  'combat-build-copy.weapon-training': '武器訓練',
  'journey-relic-copy.a-row-scan-confirming-at-least-2':
    '行走査で新たに地雷を2個以上確定すると探針+1。各階1回、上限4。',
  'journey-relic-copy.add-breach-sigil-and-duelist-edge-recover':
    '破陣の印と決闘の刃を追加。防護解除で行動力を回収し、初撃を強化。',
  'journey-relic-copy.add-marching-boots-and-shelter-cloak-cheaper':
    '行軍靴と避難の外套を追加。戦闘移動を節約し、予告回避で防護を獲得。',
  'journey-relic-copy.add-probe-recycler-and-spare-coil-recover':
    '探針回収器と予備コイルを追加。調査から探針を回収し、行走査で道具を補充。',
  'journey-relic-copy.add-reserve-watch-and-second-hand-bank':
    '蓄時の懐中時計と反響の秒針を追加。余力を次へ回し、長期戦で道具を補充。',
  'journey-relic-copy.add-skill-capacitor-and-emergency-gears-link':
    'スキル蓄電器と応急歯車を追加。スキルで走査を補充し、探針切れから立て直す。',
  'journey-relic-copy.add-trail-thread-and-landmark-lens-earn':
    '道しるべの糸と目印のレンズを追加。移動で走査を補充し、宝箱の周囲を調査。',
  'journey-relic-copy.after-surviving-the-third-combat-turn-gain':
    '戦闘の第3ターン終了まで生存すると探針と走査を各+1。各階1回、それぞれ上限4。',
  'journey-relic-copy.breach-sigil': '突破の印',
  'journey-relic-copy.cartographer-charts': '製図図録パック',
  'journey-relic-copy.chronologist-dials': '時序文字盤パック',
  'journey-relic-copy.duelist-edge': '決闘の刃',
  'journey-relic-copy.duelist-marks': '決闘紋章パック',
  'journey-relic-copy.emergency-gears': '応急歯車',
  'journey-relic-copy.end-a-combat-turn-outside-the-warning':
    '戦闘で予告範囲外でターンを終えるとシールド+1。各階1回、上限2。',
  'journey-relic-copy.first-control-or-seal-disabled-or-anchor':
    '各階最初の装置・封印停止、または錨調整で行動力1回復、上限5。',
  'journey-relic-copy.first-strike-each-floor-4-damage': '各階の初撃ダメージ+4。',
  'journey-relic-copy.in-combat-your-first-walk-of-2':
    '戦闘中、各ターン最初の2歩以上の移動は行動力を1節約。最低1、マスを開く行動は対象外。',
  'journey-relic-copy.landmark-lens': '目印のレンズ',
  'journey-relic-copy.marching-boots': '行軍靴',
  'journey-relic-copy.mechanist-gears': '機巧歯車パック',
  'journey-relic-copy.once-per-floor-end-a-turn-with':
    '各階1回、行動力を1以上残して終了すると次のターン+1、上限5。',
  'journey-relic-copy.probe-recycler': '探針回収器',
  'journey-relic-copy.refund-the-first-probe-each-floor-that':
    '各階で初めて、新情報を得ても新たな地雷を確定しなかった探針を返却。',
  'journey-relic-copy.reserve-watch': '予備の懐中時計',
  'journey-relic-copy.salvager-kit': '回収道具パック',
  'journey-relic-copy.second-hand': '反響の秒針',
  'journey-relic-copy.shelter-cloak': '避難の外套',
  'journey-relic-copy.skill-capacitor': 'スキル蓄電器',
  'journey-relic-copy.spare-coil': '予備コイル',
  'journey-relic-copy.the-first-chest-collected-each-floor-surveys':
    '各階で最初に回収した宝箱の周囲3×3を調査する。',
  'journey-relic-copy.trail-thread': '道しるべの糸',
  'journey-relic-copy.use-a-row-scan-while-out-of':
    '探針が0の時に行走査を使うと探針+2。各階1回、上限4。',
  'journey-relic-copy.using-your-profession-skill-grants-1-scan':
    '職業スキル使用後に走査+1。各階1回、上限4。',
  'journey-relic-copy.visit-12-new-safe-squares-to-gain':
    '各階で新しい安全マスを12個歩くと走査+1、上限4。同じマスは数えない。',
  'journey-relic-copy.wayfarer-tokens': '旅人の証パック',
  'magnetic-board.anchor-reveal-and-flag-surrounding-mines': '錨 · 開き周囲の地雷をマーク',
  'magnetic-board.calibrated-anchor-enter-to-ground-click-again':
    '調整済みの錨 · 乗って固定、再クリックで誘導',
  'magnetic-board.detonated-mine-walkable-crater': '地雷爆破済み · 通行可能なクレーター',
  'magnetic-copy.a-crash-opens-the-entire-3-3':
    '衝突で3×3を開き、地雷と障害物を破壊。クレーターは通行可能で数字は残る地雷数に更新。騎士に6＋爆破地雷1個につき1（追加最大3）ダメージ、HPは最低1残り、コアは3ターン露出。範囲内では突進とは別に基礎5の爆発ダメージ。防護と防御で各最低1まで軽減。通常の地雷接触では地雷が残り通行不可。',
  'magnetic-copy.activation-cancels-the-pulse-the-first-end':
    '起動で磁力停止。最初のターン終了は溜めのみ。その後1ターン退避でき、次の終了で突進。金色の経路と3×3の爆破範囲を避けよう。錨上にいると衝突失敗。突進接触は基礎5ダメージ。',
  'magnetic-copy.anchor-calibrated-lure-committed': '錨を調整 · 誘導準備完了',
  'magnetic-copy.arrows-show-the-next-magnetic-pulse-blue':
    '矢印が次の磁力を示す。青は騎士の軸へ吸引、珊瑚色は外へ最大2マス反発。残像が予想着地点。琥珀の破線は未確認マスを通り、隠れた地雷は示さない。',
  'magnetic-copy.attract': '吸引 · {p0}',
  'magnetic-copy.brace-for-1-ap-to-reduce-forced':
    '1行動力の防御で強制移動が1マス減る。調整済みの錨でも固定できる。地雷の手前で停止し、防御を無視する5ダメージ。壁や盤端への衝突は基礎3ダメージで、防護により最低1まで軽減。3ターンごとに磁力が休止。',
  'magnetic-copy.charge-at-end-turn-leave-the-route':
    'ターン終了で突進 · 経路と3×3爆破範囲から退避',
  'magnetic-copy.charging-one-full-escape-turn-after-end': '溜め中 · ターン終了後に1ターン退避可能',
  'magnetic-copy.clear-a-route-to-an-anchor-calibrate':
    '錨まで道を開き、調整して騎士を誘導。露出したコアを攻撃。',
  'magnetic-copy.collision-base-3-damage-reduced-by-defense': '衝突 · 基礎3ダメージ、防護で軽減',
  'magnetic-copy.core-exposed-turns': 'コア露出 · {p0}ターン',
  'magnetic-copy.defeated': '撃破済み',
  'magnetic-copy.grounded-resist-displacement': '固定中 · 移動を防ぐ',
  'magnetic-copy.horizontal': '横',
  'magnetic-copy.known-mine-on-the-route': '経路上に確定地雷',
  'magnetic-copy.magnetic-knight': '磁力の騎士',
  'magnetic-copy.projected-landing': '予想着地点',
  'magnetic-copy.projected-route-unverified-cells': '予想経路 · 未確認マスあり',
  'magnetic-copy.recharge-no-pulse': '蓄力 · 磁力休止',
  'magnetic-copy.repel': '反発 · {p0}',
  'magnetic-copy.reveal-an-anchor-and-flag-its-surrounding':
    '錨を開き周囲の地雷をマーク。錨上か隣からクリックし1行動力で起動。騎士から2マス以上の開いた経路が必要。調整失敗は5ダメージ。再誘導に再調整は不要。',
  'magnetic-copy.vertical': '縦',
  'milestone-copy.abyss-veteran': '深淵の熟練者',
  'milestone-copy.acquire-8-different-relics-across-expeditions-offers':
    '遠征で異なる遺物を8種類獲得。候補に出ただけでは数えない。',
  'milestone-copy.against-the-clock': '時に抗う者',
  'milestone-copy.beyond-the-entrance': '地下への旅',
  'milestone-copy.beyond-the-mirror': '鏡の向こう',
  'milestone-copy.boss-challenger': '強敵への挑戦',
  'milestone-copy.boss-hunter': 'ボスハンター',
  'milestone-copy.break-the-bastion': '砦を崩せ',
  'milestone-copy.cache-runner': '宝箱回収係',
  'milestone-copy.cache-seeker': '宝探し名人',
  'milestone-copy.clear-5-floors-across-expeditions': '遠征で合計5階を突破する。',
  'milestone-copy.clock-hunt': '時計討伐',
  'milestone-copy.collect-3-treasure-chests-across-expeditions': '遠征で宝箱を合計3個拾う。',
  'milestone-copy.deep-descent': '深く潜る',
  'milestone-copy.defeat-10-bosses-across-expeditions': '遠征でボスを合計10体倒す。',
  'milestone-copy.defeat-both-twins-without-losing-health-revival':
    'HPを失わず双子を倒す。復活も被弾に含む。',
  'milestone-copy.defeat-four-different-boss-families': '異なる4種類のボスを倒す。',
  'milestone-copy.defeat-the-bastion-without-losing-health-revival':
    'HPを失わず砦を倒す。復活も被弾に含む。',
  'milestone-copy.defeat-the-brood-queen-without-clearing-any':
    '戦闘中に蜘蛛の巣を一切除去せず女王を倒す。',
  'milestone-copy.defeat-the-clock-boss-using-exactly-one':
    '砂時計をちょうど1つ使って時計ボスを倒す。',
  'milestone-copy.defeat-the-magnetic-boss-without-being-pushed':
    '磁場で地雷に触れず磁力ボスを倒す。盾で防いでも接触は失敗。',
  'milestone-copy.defeat-the-queen-while-leaving-at-least': '巣を一つ以上残して女王を倒す。',
  'milestone-copy.defeat-this-boss-once': 'このボスを1回倒す。',
  'milestone-copy.defeat-your-first-boss': '初めてボスを倒す。',
  'milestone-copy.demolition-expert': '爆破の達人',
  'milestone-copy.depth-legend': '地底の伝説',
  'milestone-copy.field-practice': '実地訓練',
  'milestone-copy.first-challenger': '最初の挑戦',
  'milestone-copy.first-footsteps': '旅の第一歩',
  'milestone-copy.four-legends': '四つの伝説',
  'milestone-copy.homeward-bound': '凱旋',
  'milestone-copy.into-the-abyss': '深淵の征服者',
  'milestone-copy.into-the-nest': '巣への挑戦',
  'milestone-copy.long-road': '長い旅路',
  'milestone-copy.lure-a-charge-into-at-least-one': '突進で地雷を爆破させ、磁力ボスを倒す。',
  'milestone-copy.magnet-hunt': '磁力討伐',
  'milestone-copy.master-of-magnetism': '磁場の使い手',
  'milestone-copy.queen-hunt': '女王討伐',
  'milestone-copy.relic-curator': '遺物収集家',
  'milestone-copy.relic-museum': '移動博物館',
  'milestone-copy.return-route': '帰路の記録',
  'milestone-copy.rift-pioneer': '裂け目の先駆者',
  'milestone-copy.seasoned-explorer': '熟練の冒険者',
  'milestone-copy.skill-adept': '実戦の達人',
  'milestone-copy.skill-legend': '百戦錬磨',
  'milestone-copy.skill-master': '技の達人',
  'milestone-copy.skill-student': '技の修練',
  'milestone-copy.successfully-use-a-profession-skill-3-times': '職業スキルを合計3回成功させる。',
  'milestone-copy.total-1-expedition-victory': '累計1回の遠征クリア。',
  'milestone-copy.total-10-chests-collected': '累計10個の宝箱。',
  'milestone-copy.total-10-successful-profession-skills': '累計10回の職業スキル成功。',
  'milestone-copy.total-12-floors-cleared': '累計12階の突破。',
  'milestone-copy.total-150-floors-cleared': '累計150階の突破。',
  'milestone-copy.total-150-new-safe-squares-visited':
    '累計150個の新しい安全マス（同階の往復は除く）。',
  'milestone-copy.total-1500-new-safe-squares-visited':
    '累計1500個の新しい安全マス（同階の往復は除く）。',
  'milestone-copy.total-20-different-relics-acquired': '累計20種類の獲得した遺物。',
  'milestone-copy.total-200-chests-collected': '累計200個の宝箱。',
  'milestone-copy.total-200-successful-profession-skills': '累計200回の職業スキル成功。',
  'milestone-copy.total-25-chests-collected': '累計25個の宝箱。',
  'milestone-copy.total-25-floors-cleared': '累計25階の突破。',
  'milestone-copy.total-25-successful-profession-skills': '累計25回の職業スキル成功。',
  'milestone-copy.total-3-bosses-defeated': '累計3体のボス討伐。',
  'milestone-copy.total-5-abyss-victories': '累計5回の深淵クリア。',
  'milestone-copy.total-50-floors-cleared': '累計50階の突破。',
  'milestone-copy.total-500-new-safe-squares-visited':
    '累計500個の新しい安全マス（同階の往復は除く）。',
  'milestone-copy.total-60-new-safe-squares-visited':
    '累計60個の新しい安全マス（同階の往復は除く）。',
  'milestone-copy.total-75-chests-collected': '累計75個の宝箱。',
  'milestone-copy.total-75-successful-profession-skills': '累計75回の職業スキル成功。',
  'milestone-copy.trail-apprentice': '旅の見習い',
  'milestone-copy.trail-guide': '道案内',
  'milestone-copy.treasure-legend': '宝探しの伝説',
  'milestone-copy.treasure-scout': '宝探し入門',
  'milestone-copy.treasure-vault': '宝の蔵',
  'milestone-copy.twin-hunt': '双子討伐',
  'milestone-copy.untouched-bulwark': '不動の砦',
  'milestone-copy.visit-20-new-safe-squares-across-expeditions':
    '遠征で新しい安全マスを合計20個歩く。同じ階の往復は数えない。',
  'milestone-copy.web-walker': '蜘蛛の巣を歩む者',
  'milestone-copy.win-3-expeditions-existing-camp-victories-count':
    '遠征を3回クリア。既存のキャンプのクリア数も含む。',
  'milestone-copy.win-an-expedition-on-abyss-difficulty': '深淵の難易度で遠征を1回クリアする。',
  'milestone-copy.world-walker': '地下を歩く者',
  'milestone-notices.achievement': '実績',
  'milestone-notices.completed': '達成',
  'milestone-notices.dismiss': '閉じる',
  'milestone-notices.halfway-there': '半分達成',
  'milestone-notices.mission': '任務',
  'milestone-template.claim-reward': '報酬を受け取る',
  'milestone-template.claimed': '受領済み',
  'milestone-template.completed': '達成',
  'milestone-template.in-progress': '進行中',
  'milestone-template.keep-exploring': '探索を続けよう',
  'milestone-template.ready-to-claim': '受領可能',
  'milestone-template.title': '称号',
  'mirror-board.compare-shift-to-play': '比較 · 転移して操作',
  'mirror-board.explore-here': '探索中',
  'mirror-board.seal-disabled': '封印停止',
  'mirror-board.seal-protects-the-opposite-twin': '封印 · 反対側の双子を防護',
  'mirror-copy.compare-both-realms-disable-each-seal-to':
    '両界の手掛かりを比較。封印を止めて反対側の守りを解除し、交互に攻撃。',
  'mirror-copy.dawn': '暁',
  'mirror-copy.dawn-alternates-rows-and-columns-dusk-alternates':
    '暁は横列・縦列、宵は斜線を交互に攻撃。3ターンごとに両者が蓄力して休む。予告はターン終了まで固定で、現在の界からだけ被弾。転移だけではターンは進まない。',
  'mirror-copy.defeated': '撃破済み',
  'mirror-copy.dusk': '宵',
  'mirror-copy.exposed': '攻撃可能',
  'mirror-copy.mirror-seal-protects-the-opposite-twin': '鏡の封印 · 反対側の双子を防護',
  'mirror-copy.mirror-twins': '鏡像の双子',
  'mirror-copy.protected-by-seal': '{p0}の封印で防護',
  'mirror-copy.reflecting-strike-the-other-twin': '反射中 · もう一方を攻撃',
  'mirror-copy.reveal-a-seal-correctly-flag-every-neighboring':
    '封印を開き周囲の地雷を正しくマーク。接近して1行動力で停止すると反対側の双子が露出。調整失敗は5ダメージ。',
  'mirror-copy.seal-disabled-opposite-twin-exposed': '封印停止 · 反対側の守りを解除',
  'mirror-copy.shift-costs-1-ap-and-resumes-your':
    '1行動力で反対側の前回位置へ転移。比較盤は閲覧専用。位置は各界で保持し、体力・道具・スキル回数・遺物の制限は共有。',
  'mirror-copy.the-same-coordinate-cannot-contain-a-mine':
    '同じ座標に両界とも地雷があることはない。数字と旗を比較して推理。金の確定旗は反対側を安全と表示するが、通常の旗は仮説のまま。',
  'mirror-copy.while-both-twins-live-striking-one-activates':
    '両者生存中は被弾した側が反射状態になり、相手への攻撃で解除。片方を倒すとその予告は消える。生存者は反射を失うが、以後の威力が5から7に増加。',
  'mirror-template.attacks-resolve-at-end-turn-both-recharge':
    'ターン終了で攻撃判定 · 3ターンごとに両者が蓄力',
  'mirror-template.mirror-twins': '鏡像の双子',
  'mirror-template.recharging-no-enemy-attacks-this-turn': '蓄力中 · このターンは敵の攻撃なし',
  'profession-skill-copy.available-during-exploration': '探索中に使用可能',
  'profession-skill-copy.check-the-cost-and-resource-caps': '必要資源と上限を確認',
  'profession-skill-copy.choose-a-revealed-safe-landing-two-squares':
    '確定地雷か壁1マスを挟む2マス先の公開済み安全地点へ1行動で移動。各階1回。双方向の裂け目は同じ部屋で歩行に使える。地雷と数字は変化せず、ボス本体は越えられない。',
  'profession-skill-copy.column-survey': '縦列測量',
  'profession-skill-copy.confirm-mines-and-safe-cells-in-the':
    'キャラクター周囲3×3の地雷と安全なマスを判定。',
  'profession-skill-copy.confirm-mines-and-safe-cells-in-your':
    'キャラクターがいる縦列全体の地雷と安全なマスを判定。',
  'profession-skill-copy.excavate': '発掘',
  'profession-skill-copy.field-repair': '野外修理',
  'profession-skill-copy.first-use-places-an-anchor-at-your':
    '最初に足元へ錨を設置し、別の場所から再使用すると帰還。各操作1行動、各階1回帰還。同じ部屋のみ、占有中は帰還不可。',
  'profession-skill-copy.move-away-from-the-anchor-its-landing':
    '錨から離れ、帰還点の占有を解消しよう',
  'profession-skill-copy.no-new-information-here-reposition-or-explore':
    '新情報なし · 移動または探索を続ける',
  'profession-skill-copy.open-rift': '裂け目を開く',
  'profession-skill-copy.return-anchor': '帰還の錨',
  'profession-skill-copy.reveal-a-safe-landing-across-a-confirmed':
    '確定地雷か壁を挟んだ2マス先の安全地点を開こう',
  'profession-skill-copy.scout-the-nearest-uncollected-chest-s-3':
    '最寄りの未回収宝箱の周囲3×3を偵察し、安全なマスを開いて地雷をマーク。回収には移動が必要。遺物候補は最大4つ。',
  'profession-skill-copy.spend-1-scan-to-gain-1-shield': '走査1回を消費してシールド+1。上限2。',
  'profession-skill-copy.spend-1-shield-to-confirm-mines-and':
    'シールド1を消費してキャラクター周囲5×5の地雷と安全なマスを判定。',
  'profession-skill-copy.spend-1-shield-to-gain-1-probe':
    'シールド1を消費し、探針と走査を各+1。両方とも上限4未満が必要。',
  'profession-skill-copy.trail-light': '道しるべ',
  'profession-skill-copy.transmute': '錬成',
  'profession-skill-copy.use-once-per-floor': '使用 · 各階1回',
  'profession-skill-copy.used-refreshes-next-floor': '使用済み · 次の階で回復',
  'profession-skill-copy.watchtower': '見張りの眼',
  'profession-skill-template.cross-to': '移動先',
  'profession-skill-template.next-use-place-anchor': '次の操作：錨を設置',
  'profession-skill-template.not-enough-action-points-end-your-turn':
    '行動力不足。先にターンを終了',
  'profession-skill-template.return-anchor-row-column': '帰還点（行、列）',
  'relic-expansion-copy.a-probe-confirming-2-new-mines-grants':
    '探針1回で新たに地雷を2個確定すると走査+1。各階1回、上限4。',
  'relic-expansion-copy.add-field-dressing-and-second-wind-chest':
    '応急包帯と再起のお守りを追加。宝箱で回復し、致命傷に一度耐える。',
  'relic-expansion-copy.add-field-notes-and-rangefinder-to-future':
    '調査ノートと測距器を遺物候補に追加。新しい発見で道具を補充。',
  'relic-expansion-copy.add-reactive-shell-and-rescue-ribbon-shield':
    '反応装甲と救援リボンを追加。シールドで調査し、負傷時に防護。',
  'relic-expansion-copy.add-supply-cache-and-cache-guard-recover':
    '補給の隠し箱と宝探しの護符を追加。宝箱の回収で走査と防護を獲得。',
  'relic-expansion-copy.cache-guard': '宝探しの護符',
  'relic-expansion-copy.collect-all-3-chests-on-a-floor':
    '同じ階の宝箱3個を全て回収するとシールド+1。各階1回、上限2。',
  'relic-expansion-copy.confirm-3-mines-on-a-floor-to':
    '同じ階で地雷を3個確定すると探針+1。各階1回、上限4。',
  'relic-expansion-copy.field-dressing': '野戦包帯',
  'relic-expansion-copy.field-notes': '調査ノート',
  'relic-expansion-copy.first-chest-each-floor-restores-5-health': '各階の最初の宝箱で体力5回復。',
  'relic-expansion-copy.guardian-crests': '守護紋章パック',
  'relic-expansion-copy.once-per-expedition-survive-lethal-damage-with':
    '遠征中1回、致命傷を体力5で耐える。',
  'relic-expansion-copy.prospector-seals': '採掘印章パック',
  'relic-expansion-copy.rangefinder': '測距器',
  'relic-expansion-copy.reactive-shell': '反応装甲',
  'relic-expansion-copy.rescue-ribbon': '救援リボン',
  'relic-expansion-copy.second-wind': '再起',
  'relic-expansion-copy.supply-cache': '補給の隠し箱',
  'relic-expansion-copy.surveyor-notes': '調査手記パック',
  'relic-expansion-copy.survival-charms': '生存護符パック',
  'relic-expansion-copy.survive-health-damage-to-gain-1-shield':
    'HPダメージを受けて生存するとシールド+1。遠征中1回、上限2。',
  'relic-expansion-copy.the-first-chest-collected-each-floor-grants':
    '各階で最初に回収する宝箱で走査+1、上限4。',
  'relic-expansion-copy.the-first-shielded-mine-hit-each-floor':
    '各階で最初に地雷をシールドで防ぐと、その周囲3×3を調査。',
  'sonar-copy.already-scanned-reading-selected': 'スキャン済みの結果を選択しました',
  'sonar-copy.choose-send-pulse-then-a-center-square':
    'パルスを選び、中心マスを押します。端で切り取った3 × 3範囲の地雷総数です。旗も含みますが、地雷の個々の位置は示しません。',
  'sonar-copy.choose-the-center-of-a-3-3': '3 × 3 範囲の中心を選択。Escで取消。',
  'sonar-copy.compare-echoes': '反響を比較',
  'sonar-copy.compare-two-echoes': '2つの反響を比べる',
  'sonar-copy.echo': '反響',
  'sonar-copy.echo-log': '反響ログ',
  'sonar-copy.enlarge-squares': 'マスを拡大',
  'sonar-copy.every-echo-accounted-for': 'すべての反響を解き明かしました。',
  'sonar-copy.exclusive-region': '固有範囲',
  'sonar-copy.fewest-moves-first-fewer-pulses-break-ties':
    '操作数が少ない順。同数ならパルスの少ない順。',
  'sonar-copy.fit-board': '幅に合わせる',
  'sonar-copy.make-each-pulse-count': 'パルスを大切に',
  'sonar-copy.mine-difference-outside-the-overlap': '重なりを除いた地雷数の差',
  'sonar-copy.mines': '個の地雷',
  'sonar-copy.moves': '操作数',
  'sonar-copy.no-pulses-left-four-safe-excavations-recharge':
    '残り0回。安全な掘削4回で1回分を補充。',
  'sonar-copy.one-echo-left-unanswered': 'ひとつの反響が残りました。',
  'sonar-copy.open-a-square-to-start': 'まずマスを開きましょう。',
  'sonar-copy.open-the-board': '盤面を開く',
  'sonar-copy.pulses-left': '残りパルス',
  'sonar-copy.pulses-used': '使用パルス',
  'sonar-copy.scan-target': 'スキャン対象',
  'sonar-copy.scan-to-open-the-center-mines-become':
    '走査で区域の地雷数を測り、中心を開き、地雷は金の旗に。安全な掘削4回で1回分を補充。',
  'sonar-copy.select-a-square-to-open-it': 'マスを押して開きます。',
  'sonar-copy.select-two-log-entries-their-shared-squares':
    'ログを2つ選びます。共通部分を相殺すると、総数の差は固有範囲の地雷数の差になります。旗は自分の推測のままです。',
  'sonar-copy.select-two-readings-to-compare-their-regions': '2つの結果を選び、範囲を比べます。',
  'sonar-copy.send-pulse': 'パルスを送る',
  'sonar-copy.shared-squares': '重なるマス',
  'sonar-copy.sonar': 'ソナー',
  'sonar-copy.spend-a-pulse': 'パルスを送る',
  'sonar-copy.start-with-three-pulses-four-safe-excavation':
    '最初は3回、安全な掘削4回で1回補充。クリックかドラッグで走査し、中心だけを開き、地雷は金の旗になります。範囲内の数字は以後はっきり見えますが、ほかのマスは自分で開きます。同じ中心は無料で結果を再表示。Qで照準、Enter/Spaceで実行、Escで取消。Fで旗、Sで安全メモ、Cで周囲を開き、右クリックや長押しで印を切替。パルスと盤面操作は別々に数えます。',
  'sonar-copy.the-first-opening-and-its-neighbors-are':
    '最初のマスと周囲は安全です。安全なマスをすべて開くと勝利です。',
  'sonar-copy.the-saved-puzzle-could-not-be-restored':
    '保存した盤面を復元できませんでした。有効な記録は残っています。',
  'sonar-copy.this-puzzle-reached-its-move-limit-start':
    '操作上限に達しました。新しい盤面を始めてください。',
  'sonar-copy.tutorial': 'チュートリアル',
  'sonar-copy.your-first-clear-belongs-here': '最初のクリアを待っています。',
  'sonar-copy.your-readings-will-appear-here': 'スキャン結果がここに残ります。',
  'sonar-view.confirmed-mine': '地雷確認済み',
  'sonar-view.obscured-clue-scan-to-clarify': '不鮮明な数字 · 走査で判読',
  'sonar-view.recharge': '充填',
  'sonar-view.recharge-progress-label': '安全な掘削による充填',
  'tactical-copy.already-used-or-the-target-is-cleared': '操作済み、または対象除去済み',
  'tactical-copy.anchors-recharge-after-the-lure-and-exposure': '誘導・コア露出中は再起動不可',
  'tactical-copy.approach-and-click-the-core-to-prime': '隣接してコアを1行動力で起動',
  'tactical-copy.attack-avoided-or-blocked': '攻撃を回避または防御',
  'tactical-copy.battle-in-progress-watch-the-attack-forecast': '戦闘中 · 攻撃予告を確認',
  'tactical-copy.braced-reduce-enemy-damage-by-3-this': '防御中 · 敵のダメージを3軽減',
  'tactical-copy.calibration-failed-5-damage': '調整失敗 · 5ダメージ',
  'tactical-copy.choose-a-reachable-cell': '到達可能なマスを選択',
  'tactical-copy.core-overloaded-three-turn-strike-window': 'コア過負荷 · 3ターン露出',
  'tactical-copy.core-primed-strike-window-open': 'コア起動 · 露出開始',
  'tactical-copy.cost-ap': '行動力 {p0}',
  'tactical-copy.deduce-and-destroy-nests-to-weaken-the': '巣を推理して破壊し女王の防護を弱める',
  'tactical-copy.disable-both-shield-pylons-first': '先に2基の装置を停止',
  'tactical-copy.disable-the-seal-in-the-opposite-realm': '先に反対側の封印を停止',
  'tactical-copy.egg-destroyed-hatching-prevented': '卵を破壊 · 孵化を阻止',
  'tactical-copy.enemy-attack-hit': '敵の攻撃が命中',
  'tactical-copy.flag-all-mines-around-the-target-first': '対象周囲の全地雷をマーク',
  'tactical-copy.grounded-resist-the-pulse-and-reduce-enemy':
    '固定中 · 磁力を防ぎ、敵ダメージを3軽減',
  'tactical-copy.hatchling-intercepted-attack-cancelled': '幼体を撃破 · 予告取消',
  'tactical-copy.lure-locked-clear-the-gold-route': '誘導確定 · 金色の経路を空ける',
  'tactical-copy.lure-the-knight-into-an-anchor-to': '錨を起動し騎士を衝突させる',
  'tactical-copy.magnetic-displacement-resisted': '磁力による移動を防いだ',
  'tactical-copy.move-next-to-the-target-first': '対象に隣接するマスへ移動',
  'tactical-copy.needs-ap-shorten-the-route-or-end':
    '行動力{p0}が必要 · 経路を短くするかターン終了',
  'tactical-copy.nest-destroyed-supply-stopped-queen-armor-and':
    '巣を破壊 · 補充停止、女王の防護と回復減少',
  'tactical-copy.one-twin-defeated-the-survivor-s-future': '片方を撃破 · 生存者の次の攻撃が強化',
  'tactical-copy.open-a-route-of-at-least-two': '騎士から錨まで2マス以上の経路を開く',
  'tactical-copy.realm-shifted-the-turn-continues': '転移完了 · 同じターンを続行',
  'tactical-copy.reflection-active-shift-and-strike-the-other': '反射中 · 転移してもう一方を攻撃',
  'tactical-copy.return-a-spell-with-an-hourglass-to': '砂時計で術を返送して障壁を解除',
  'tactical-copy.strike-landed-damage': '攻撃命中 · {p0}ダメージ',
  'tactical-copy.web-cleared-lane-open': '巣網を除去 · 通行可能',
  'tactical-template.ap-left': '残り {p0}',
  'tactical-template.battle-reference': '戦闘の手引き',
  'tactical-template.prime-core-1-ap': 'コア起動 · 1',
  'tactical-template.replay-arrival': '登場をもう一度',
  'tactical-template.shift-realm-1-ap': '鏡界転移 · 1',
  'templates.learn-to-play': 'はじめての練習',
  'title-copy.attack-1-against-a-boss-at-half': 'ボスのHPが半分以下なら攻撃 +1。',
  'title-copy.attack-1-while-your-health-is-at': '自身のHPが半分以下なら攻撃 +1。',
  'title-copy.attack-2-against-the-brood-queen-while': '巣が残る育巣女王に対して攻撃 +2。',
  'title-copy.attack-2-while-the-magnetic-knight-is': '磁力騎士の装甲破壊中、攻撃 +2。',
  'title-copy.completing-your-profession-skill-in-battle-refunds':
    'ボス戦で職業スキルが成功すると行動力を1返還。上限5、各階1回。',
  'title-copy.completing-your-profession-skill-restores-1-health':
    '職業スキルの成功でHPを1回復。各階1回。',
  'title-copy.defense-1-in-the-brood-queen-battle': '育巣女王戦で防御 +1。',
  'title-copy.defense-1-while-braced': '防御態勢中、防御 +1。',
  'title-copy.defense-1-while-your-health-is-at': '自身のHPが3分の1以下なら防御 +1。',
  'title-copy.depart-with-1-extra-probe-up-to': '出発時にプローブ +1。上限4。',
  'title-copy.depart-with-1-extra-scanner-up-to': '出発時にスキャナー +1。上限4。',
  'title-copy.entering-floors-4-and-7-each-adds': '4階と7階に入るたび最大HP +1、HPを1回復。',
  'title-copy.every-third-boss-turn-starts-with-1': 'ボス戦の3の倍数ターンは行動力 +1。上限5。',
  'title-copy.gain-1-shield-when-entering-a-boss': 'ボス部屋に入るとシールド +1。上限2。',
  'title-copy.maximum-health-1-for-this-expedition': '今回の遠征で最大HP +1。',
  'title-copy.recover-2-health-when-entering-a-boss': 'ボス部屋に入るとHPを2回復。',
  'title-copy.the-first-chest-each-floor-restores-1': '各階の最初の宝箱でHPを1回復。',
  'title-copy.the-first-turn-of-each-boss-battle': '各ボス戦の第1ターンは行動力 +1。上限5。',
  'title-copy.the-first-two-chests-of-the-expedition':
    '遠征の最初の宝箱2個でプローブを各1補充。上限4。',
  'title-copy.the-third-chest-of-the-expedition-grants':
    '遠征の3個目の宝箱でスキャナー +1。上限4。',
  'title-copy.with-3-or-more-relics-reward-offers': '遺物が3個以上なら報酬候補 +1。上限5。',
  'title-copy.with-fewer-than-3-relics-reward-offers': '遺物が3個未満なら報酬候補 +1。上限5。',
  'title-template.changes-apply-next-departure': '変更は次の出発から有効。',
  'title-template.choose-a-title': '称号を選ぶ',
  'title-template.earn-titles-through-achievements': '実績を達成して称号を獲得。',
  'title-template.expedition-title': '遠征の称号',
  'title-template.no-title': '称号なし',
  'title-template.no-titles-earned-yet': '獲得した称号はありません',
  'title-template.this-expedition': '今回の称号',
  'tutorial-lessons.a-probe-looks-ahead': '探針で先を調べる',
  'tutorial-lessons.a-quiet-first-step': '最初の一歩',
  'tutorial-lessons.alternate-between-local-clues-and-proven-mines':
    '手元の数字と反対側の確定地雷を行き来しましょう。根拠のない旗はあくまで推測です。',
  'tutorial-lessons.bring-the-discovery-across': '発見を向こう側へ',
  'tutorial-lessons.choose-when-to-descend': '準備ができたら次の階へ',
  'tutorial-lessons.classic-first-field': 'クラシック · 最初の盤面',
  'tutorial-lessons.clear-the-blur': 'ソナーで数字を判読',
  'tutorial-lessons.cycle-to-quick-open-you-will-pass':
    '操作を「周囲を開く」まで切り替えます。途中の安全メモは推測です。周囲を開く操作は、数字と旗数が一致すると残りの隣接マスを開きます。',
  'tutorial-lessons.expedition-leave-camp': '遠征 · 最初の出発',
  'tutorial-lessons.explore-from-your-route': '道から探索を広げる',
  'tutorial-lessons.finish-with-confidence': '確信を持って最後の一手',
  'tutorial-lessons.flag-the-glowing-covered-square-a-flag':
    '光る未開封マスに旗を立てましょう。旗は探知機ではなく自分のメモ。今回は数字を根拠に判断しました。',
  'tutorial-lessons.keep-both-boards-in-view': '両方を見渡す',
  'tutorial-lessons.leave-a-reliable-mark': '推理を旗に残す',
  'tutorial-lessons.make-a-second-deduction': 'もう一度推理',
  'tutorial-lessons.most-numbered-squares-are-obscured-select-sonar':
    '数字の多くは不鮮明。ソナーを選び光るマスへ。中心だけ開き、地雷は金の旗になり、3 × 3 内の地雷数も分かります。範囲内の数字は以後鮮明になり、ほかのマスは自分で開きます。',
  'tutorial-lessons.move-to-the-glowing-open-square-your':
    '光る開いたマスへ移動。探検家は既知の安全な道を歩きます。通常階にターン制限や行動力消費はありません。',
  'tutorial-lessons.one-button-four-actions': 'ボタン1つで操作切替',
  'tutorial-lessons.open-a-safe-neighborhood': '周囲をまとめて開く',
  'tutorial-lessons.open-the-glowing-square-empty-ground-opens':
    '光るマスを開きましょう。空白はつながって開き、数字で止まります。',
  'tutorial-lessons.open-the-matching-glowing-square-on-b':
    'Bの同じ光るマスを開きます。共有するのは推理であって数字ではありません。各盤面の数字は自分の地雷だけを数えます。',
  'tutorial-lessons.open-the-route': '道を開く',
  'tutorial-lessons.press-the-action-button-once-to-select':
    '操作ボタンを1回押して旗へ。マウスは右クリック、タッチは長押し、キーボードはマスに移動してFでも操作できます。',
  'tutorial-lessons.quick-open-this-1-its-flagged-neighbor':
    'この「1」で周囲を開きます。隣の旗が地雷1個を示すので、下の未開封マスは安全です。',
  'tutorial-lessons.reach-the-treasure': '宝箱まで歩く',
  'tutorial-lessons.read-the-neighborhood': '数字は周囲8マス',
  'tutorial-lessons.reveal-this-frontier-square-your-explorer-first':
    '境界の光るマスを開きます。安全な道で近づいてから掘ります。遠い未開封マスには隣まで行ける道が必要です。',
  'tutorial-lessons.select-the-matching-flag-on-a-once':
    'Aの旗をもう一度選び、両盤面の対応位置を確認。両方の安全マスを全部開くと勝利、どちらかで地雷を踏むと終了です。',
  'tutorial-lessons.select-the-probe-then-the-glowing-square':
    '探針を選び、光るマスを押します。指定した3×3を移動せず調査。無効・重複の対象では回数を消費しません。',
  'tutorial-lessons.select-the-scanner-then-any-glowing-square':
    '走査器を選んで最下段の光るマスを押すと、その行の地雷と安全を確認。道具の残り回数はバーに表示されます。',
  'tutorial-lessons.select-the-stairs-deliberately-to-leave-the':
    '準備ができたら階段を選びます。体力は次の階へ持ち越し、地雷は5ダメージ、盾1枚は最大5吸収。ボス部屋では行動力を使い、登場時の言動が手がかりになります。',
  'tutorial-lessons.select-this-1-to-inspect-its-eight':
    'この「1」を選び、周囲8マスを確認。右の未開封マス以外は安全なので、そこに1個の地雷があります。',
  'tutorial-lessons.sonar-read-the-echoes': 'ソナー · 反響を読む',
  'tutorial-lessons.start-with-3-pulses-four-successful-safe':
    '最初は3回。安全な掘削4回で1回分補充。空白の連鎖は1回、再クリックや旗は対象外。過去の結果は自由に確認できます。',
  'tutorial-lessons.survey-a-whole-row': '一列を調査する',
  'tutorial-lessons.test-the-other-side': '向こう側で確かめる',
  'tutorial-lessons.the-revealed-1-diagonally-above-right-of':
    'このマスの右上の「1」には、未確認の隣接マスがこれだけ。ここにも旗を。急がず確実に判断しましょう。',
  'tutorial-lessons.the-two-boards-never-have-mines-at':
    '同じ座標に両方の地雷はありません。Aで確定した地雷の位置は、Bでは必ず安全。操作を「開く」に戻しましょう。',
  'tutorial-lessons.twin-two-sides-of-a-clue': '双生 · 同じ座標の向こう側',
  'tutorial-lessons.use-explorer-s-light-it-surveys-the':
    '探検家の灯りで周囲3×3を調査。各階1回です。確定地雷は固定表示、安全と分かったマスも自分で開きます。スキルは下のバーにあります。',
  'tutorial-lessons.use-quick-open-on-this-1-its':
    '光る「1」で周囲を開きましょう。隣の地雷には旗があるので、残りは安全。すべての安全マスを開けば勝利です。',
  'tutorial-lessons.walk-to-the-glowing-chest-to-collect':
    '光る宝箱まで歩いて回収。見つけただけでは入手できません。後で手に入る遺物は開閉できる一覧に入ります。',
  'tutorial-lessons.you-are-on-the-board': '盤面に自分がいる',
  'tutorial-lessons.you-can-move-scout-collect-and-descend':
    '移動、調査、回収、階段を練習できました。本番は階層クリア後に遺物を選び、体力に注意し、必要なら帰還しましょう。',
  'tutorial-lessons.you-read-clues-marked-mines-and-opened':
    '数字を読み、旗を立て、周囲を開けました。本番では誤った旗が危険につながります。迷ったら数字を確認しましょう。',
  'tutorial-lessons.your-profession-has-a-skill': '職業スキルを使う',
  'tutorial-player.back-to-game': 'ゲームへ',
  'tutorial-player.chests': '宝箱',
  'tutorial-player.click-tap-arrows-enter': 'クリック / タップ · 矢印 + Enter',
  'tutorial-player.column': '列',
  'tutorial-player.continue': '次へ',
  'tutorial-player.covered': '未開封',
  'tutorial-player.exit-practice': '練習を終了',
  'tutorial-player.flag': '旗',
  'tutorial-player.good-continue-when-you-are-ready': 'できました。準備ができたら次へ。',
  'tutorial-player.learn-by-doing': '実際に練習',
  'tutorial-player.light': '灯り',
  'tutorial-player.practice-field': '練習盤面',
  'tutorial-player.probe': '探針',
  'tutorial-player.ready-for-the-field': '本番へ進もう',
  'tutorial-player.row': '行',
  'tutorial-player.scan': '走査器',
  'tutorial-player.sonar': 'ソナー',
  'tutorial-player.start-again': '最初から',
  'tutorial-player.try-here': 'ここを操作',
  'tutorial-player.try-the-highlighted-action-first-nothing-was':
    'まず光る操作を試してください。何も消費していません。',
  'variant-app.battle-reference': '戦闘の手引き',
  'variant-copy.1-loadout-point-starting-probes-1': '装備1ポイント。初期探針+1。',
  'variant-copy.1-loadout-point-starting-scans-1': '装備1ポイント。初期走査+1。',
  'variant-copy.1-probe-1-scan-1-shield': '探針1 · 走査1 · シールド1',
  'variant-copy.1-probe-1-shield-each-floor-1': '探針1 · シールド1 · 各階：シールド1 → 5×5偵察',
  'variant-copy.1-probe-2-scans': '探針1 · 走査2',
  'variant-copy.1-probe-on-each-new-floor-up': '新階層ごとに探針+1、上限4。',
  'variant-copy.1-probe-scout-a-chest-each-floor': '探針1 · 各階で宝箱を偵察 · 遺物最大4択',
  'variant-copy.1-scan-on-each-new-floor-up': '新階層ごとに走査+1、上限4。',
  'variant-copy.2-loadout-points-starting-shields-1': '装備2ポイント。初期シールド+1。',
  'variant-copy.2-probes-1-scan': '探針2 · 走査1',
  'variant-copy.2-shields-each-floor-1-shield-1': 'シールド2 · 各階：シールド1 → 探針1 + 走査1',
  'variant-copy.abyss': 'アビス',
  'variant-copy.abyss-hourglass': '深淵の砂時計',
  'variant-copy.achievement-exclusive-clear-50-floors-and-claim':
    '実績限定：50階突破し「裂け目の先駆者」を受領。初期探針2。',
  'variant-copy.achievement-exclusive-confirm-5-unique-mines-in':
    '実績限定。各階で異なる地雷5個を確定すると探針と走査+1、各上限4、各階1回。',
  'variant-copy.achievement-exclusive-the-first-chest-collected-each':
    '実績限定。各階で最初の宝箱を拾うとシールド+1、上限2。',
  'variant-copy.add-exit-compass-and-salvage-seal-to': '出口の羅針盤と回収の印を遺物候補に追加。',
  'variant-copy.advanced': 'アドバンス',
  'variant-copy.aegis': '加護',
  'variant-copy.alchemist': '錬金術師',
  'variant-copy.an-incompatible-or-damaged-save-was-ignored':
    '非互換または破損した保存を無視しました。復元可能なキャンプ履歴は保持します。',
  'variant-copy.archaeologist': '考古学者',
  'variant-copy.arrows-home-end-move-focus-enter-space':
    '矢印 / Home / End で移動、Enter / Space で開く。F・右クリック・長押しで旗。旗モードを選んでからタップすることもできます。',
  'variant-copy.at-each-coordinate-at-most-one-board':
    '同じ座標に地雷があるのは最大で片方のみ。A の地雷を推理できれば B の同じマスは安全ですが、両方安全な場合もあります。旗は証明ではありません。両盤の安全マスを全て開けば勝利、片方で踏めば終了。初手は両盤で安全な領域が開きます。',
  'variant-copy.banked-supplies': '獲得物資',
  'variant-copy.base-camp': 'キャンプ',
  'variant-copy.base-settlement': '基本精算',
  'variant-copy.begin-expedition': '遠征開始',
  'variant-copy.camp-and-results-preserved-the-previous-dungeon':
    'キャンプと記録は保持しました。マップ更新により旧遠征は終了しました。',
  'variant-copy.camp-facilities': 'キャンプ施設',
  'variant-copy.chest-beacon': '宝箱ビーコン',
  'variant-copy.choose-a-relic': '遺物を選ぶ',
  'variant-copy.choose-one-relic-for-the-next-floor': '遺物を1つ選んで次の階へ',
  'variant-copy.choose-the-first-opening-on-either-board': 'どちらかの盤で初手を選びましょう。',
  'variant-copy.choose-your-difficulty-and-expedition-length-build':
    '難易度と階層数を選び、遺物構成を育てます。帰還で全戦利品、敗北で半分、クリアで追加報酬。物資で職業と3ポイントの初期装備を解放。成長は選択肢を増やし、地雷の危険は残ります。',
  'variant-copy.classic': 'クラシック',
  'variant-copy.click-revealed-floor-to-walk-there-along':
    '開いた床をクリックすると既知の安全な最短経路を歩きます。境界をクリックすると近づいて探索します。宝箱は訪れて回収。階段へ歩いて到着すると遺物を選び次の階へ。安全な床は上下左右につながり、孤立した場所は壁になります。数字は周囲8マスを数え、青い旗は推測、金の旗は確定地雷で解除不可。階ごとに内側の入口が変わり、小さな不規則な領域と有効な数字で始まります。',
  'variant-copy.collect-a-chest-to-scout-the-next':
    '宝箱を拾うと次の未回収宝箱の周囲3×3を偵察。各階1回、自動回収なし。',
  'variant-copy.collected': '回収済み',
  'variant-copy.completed-expeditions': '遠征クリア',
  'variant-copy.completing-a-profession-skill-scouts-your-landing':
    '職業スキル完了時に着地点の横一列を偵察。各階1回。帰還点設置時は発動しない。',
  'variant-copy.confirm-4-distinct-mines-in-a-floor':
    '各階で異なる地雷4個を確定すると出口周囲3×3を偵察。各階1回、出口や守護者を無視しない。',
  'variant-copy.confirm-8-distinct-mines-in-a-floor':
    '各階で異なる地雷8個を確定するとHPを2回復。最大体力まで、各階1回。',
  'variant-copy.confirmed-mine-locked-flag': '地雷確定 · 旗を固定',
  'variant-copy.confirmed-safe': '安全確認済み',
  'variant-copy.continue-to-next-floor': '次の階へ',
  'variant-copy.difficulty': '難易度',
  'variant-copy.difficulty-bonus': '難易度ボーナス',
  'variant-copy.difficulty-reward': '難易度報酬',
  'variant-copy.drag-a-tool-onto-the-board-or':
    '道具を盤面へドラッグ、または選んで対象をクリック。',
  'variant-copy.end-this-expedition-and-bank-all-collected':
    '遠征を終了し、集めた戦利品を持ち帰りますか？',
  'variant-copy.engineer': '工兵',
  'variant-copy.entrance': '入口',
  'variant-copy.exit': '出口',
  'variant-copy.exit-compass': '出口の羅針盤',
  'variant-copy.expedition': '遠征',
  'variant-copy.expedition-complete': '遠征クリア',
  'variant-copy.expedition-ended': '遠征失敗',
  'variant-copy.expert': 'エキスパート',
  'variant-copy.explorer': '探検家',
  'variant-copy.explorer-2': '探検家',
  'variant-copy.extract-to-camp': 'キャンプへ帰還',
  'variant-copy.fault-map': '断層地図',
  'variant-copy.field-radio': '野戦無線機',
  'variant-copy.find-a-safe-route-to-the-exit': '出口への安全な道を探しましょう。',
  'variant-copy.find-your-first-relic-after-floor-one': '第1階層を突破して遺物を入手。',
  'variant-copy.fit-board': '盤面を全体表示',
  'variant-copy.floor': '階層',
  'variant-copy.floor-cleared': 'フロアクリア',
  'variant-copy.future-treasures-give-9-supplies-instead-of': '以後の宝箱報酬が6から9に。',
  'variant-copy.gain-1-shield-up-to-2-absorbs':
    'シールドを1つ獲得、上限2。最大5ダメージを吸収。踏んだ地雷は解除できない赤い地雷印になります。',
  'variant-copy.game-mode': 'ゲームモード',
  'variant-copy.game-updated-your-expedition-returned-to-camp':
    'ゲーム更新により遠征から帰還し、物資{p0}を持ち帰りました。キャンプの成長は保持されています。',
  'variant-copy.guard': '防護',
  'variant-copy.health': '体力',
  'variant-copy.hunter-seal': '狩人の印',
  'variant-copy.inspect-a-3-3-area-gold-flags': '周囲3×3を探査：金の旗は地雷、緑の点は安全。',
  'variant-copy.inspect-a-whole-row-gold-flags-mark': '行全体を走査：金の旗は地雷、緑の点は安全。',
  'variant-copy.keep-75-of-collected-loot-on-defeat': '敗北時の回収率が50%から75%に。',
  'variant-copy.lantern': 'ランタン',
  'variant-copy.larger-cells': 'マスを拡大',
  'variant-copy.last-bastion': '最後の砦',
  'variant-copy.loadout-3-points': '装備 · 3 ポイント',
  'variant-copy.matching-coordinate': '対応する座標',
  'variant-copy.mines-total': '地雷合計',
  'variant-copy.mission-exclusive-1-loadout-point-a-successful':
    'ミッション限定・装備1ポイント。職業スキル成功で探針+1、上限4、各階1回。',
  'variant-copy.mission-exclusive-clear-12-floors-and-claim':
    '任務限定：12階突破し「帰路の記録」を受領。初期探針1、走査1。',
  'variant-copy.moves': '手数',
  'variant-copy.original-rules': '旧ルール',
  'variant-copy.partner-cleared-flagged-mines-there-are-now':
    '相手盤クリア済み：その地雷印は確定です。',
  'variant-copy.probe-3-3-area': '3×3範囲を探査',
  'variant-copy.probe-found-count-mines': '探査で地雷{count}個を発見。',
  'variant-copy.probe-kit': '探針キット',
  'variant-copy.probes': '探針',
  'variant-copy.profession': '職業',
  'variant-copy.pulse-coil': 'パルスコイル',
  'variant-copy.reachable-frontier': '探索可能な境界',
  'variant-copy.recent-results-this-mode': '最近の結果 · このモード',
  'variant-copy.relaxed': 'リラックス',
  'variant-copy.relic-archive': '遺物資料館',
  'variant-copy.relic-build': '遺物構成',
  'variant-copy.revive-at-3-hp-and-scout-your':
    '致命傷でHP3で復活し周囲3×3を偵察。遠征1回。セカンドウィンドが優先し砂時計は温存。',
  'variant-copy.riftwalker': '裂け目使い',
  'variant-copy.run-loot': '戦利品',
  'variant-copy.safely-extracted': '帰還成功',
  'variant-copy.salvage-seal': '回収の印',
  'variant-copy.scan-a-row': '行を走査',
  'variant-copy.scanner': '走査器',
  'variant-copy.scans': '走査',
  'variant-copy.scout-the-exit-s-3-3-area':
    '各階の出口周囲3×3を偵察し、安全なマスを開き地雷をマーク。',
  'variant-copy.scroll-or-swipe-to-explore-the-enlarged':
    'スクロールやスワイプで拡大した盤面を移動。',
  'variant-copy.sentinel': '番人',
  'variant-copy.shields': 'シールド',
  'variant-copy.stairs-reachable-click-them-when-ready-to':
    '階段へ到達可能 · 出発するときにクリック。',
  'variant-copy.standard': 'スタンダード',
  'variant-copy.supplies': '物資',
  'variant-copy.survey-lens': '測量レンズ',
  'variant-copy.survey-token': '探査のお守り',
  'variant-copy.surveyor': '測量士',
  'variant-copy.survive-health-damage-with-2-hp-or':
    '体力ダメージ後に生存してHP2以下ならシールドを2に。遠征1回、復活なし。',
  'variant-copy.this-run-reached-the-move-limit-extract':
    '手数上限です。帰還するか双子盤を再開してください。',
  'variant-copy.trail-heart': '旅路の心',
  'variant-copy.treasure-pouch': '宝袋',
  'variant-copy.treasure-safe': '宝箱 · 安全',
  'variant-copy.triggered-mine': '踏んだ地雷',
  'variant-copy.twin-boards': '双子盤',
  'variant-copy.unlock-at-camp': 'キャンプで解放',
  'variant-copy.unlock-departure-equipment-choose-up-to-3': '初期装備を解放。毎回3ポイントまで。',
  'variant-copy.unlocked': '解放済み',
  'variant-copy.used-this-expedition': 'この遠征で発動済み',
  'variant-copy.used-this-floor': 'この階で発動済み',
  'variant-copy.used-this-turn': 'このターンで発動済み',
  'variant-copy.view-results': '結果を見る',
  'variant-copy.wall-impassable': '壁 · 通行不可',
  'variant-copy.waymarker': '道標使い',
  'variant-copy.workshop': '工房',
  'variant-copy.your-story-starts-here': 'ここから冒険が始まる。',
  'variant-view.resonator-four-turn-core-windows': '共鳴装置 · コア露出を4ターンに延長',
  'variant-view.return-anchor': '帰還の錨',
  'variant-view.rift-landing': '裂け目の着地点',
  'variant-view.suppressor-lowers-future-attacks-to-3': '抑制装置 · 以後の攻撃を3に軽減',
  'variant-view.two-way-rift': '双方向の裂け目',
}
