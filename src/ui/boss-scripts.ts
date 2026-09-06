import { battleText } from './combat-build-copy.js'
import type { Language } from '../types/localization.js'
import type { EncounterKind } from '../types/tactical.js'
import type { PrologueBeat, PrologueScript } from '../types/guidance.js'

/** Character dialogue hints at counterplay without prescribing a button sequence. */
export function bossScript(kind: EncounterKind, language: Language): PrologueScript {
  const t = (en: string, zh: string, ja: string): string => battleText(language, en, zh, ja)
  const b = (
    speaker: PrologueBeat['speaker'],
    focus: PrologueBeat['focus'],
    en: string,
    zh: string,
    ja: string,
  ): PrologueBeat => ({ speaker, focus, line: t(en, zh, ja) })
  if (kind === 'bastion')
    return {
      kind,
      title: t('Bastion Guardian', '堡垒守卫', '城塞の守護者'),
      subtitle: t('The door that learned to breathe', '会呼吸的门', '呼吸する扉'),
      sprite: 'bastion',
      prop: 'bastion-pylon',
      beats: [
        b(
          'scene',
          'field',
          'Beyond the stairs, something immense draws a slow, metallic breath. Two lights answer from opposite ends of the room.',
          '楼梯尽头，一扇厚重的“门”缓缓起伏，像在呼吸。房间两端，琥珀与蓝色的光交替亮起。',
          '階段の先で巨大な扉が呼吸する。部屋の両端で琥珀と青の光が交互に灯った。',
        ),
        b(
          'boss',
          'boss',
          'No one passes. The walls remember every blow.',
          '站住。想从这里过去？先看看你能不能砍穿这身铁甲。',
          '止まれ。この壁は、無駄に終わった一撃をすべて覚えている。',
        ),
        b(
          'player',
          'boss',
          'My blade rings against its armor. Not even a scratch. But that pulse did not come from its chest.',
          '刀刃撞上外壳，连一道划痕也没留下……可刚才那阵脉动，不是从它胸口传来的。',
          '刃は鎧に弾かれ、傷ひとつない。でも今の脈動は、胸からではなかった。',
        ),
        b(
          'scene',
          'objective',
          'The amber light brightens; the guardian’s arm rises. The blue light hums, and the opening in its chest snaps shut.',
          '琥珀灯一亮，守卫的重臂便抬起来；蓝灯低鸣，胸前刚露出的缝隙又闭合了。',
          '琥珀が光ると重い腕が上がる。青が唸ると、胸の隙間が閉じた。',
        ),
        b(
          'player',
          'objective',
          'One feeds the blows. The other keeps the shell closed. Those numbered stones might lead me to their controls.',
          '琥珀机关在给它的手臂供能，蓝色机关控制着胸口的护甲。得想办法把它们关掉。',
          '片方が攻撃を支え、もう片方が殻を保つ。数字の石を読めば、制御部まで行けそうだ。',
        ),
        b(
          'boss',
          'field',
          'You watch the lamps instead of the gate? The floor has swallowed wiser trespassers.',
          '盯着那两个机关做什么？小心脚下，别还没走到就丢了命。',
          '門ではなく灯りを見るか。足元は、お前より賢い侵入者も飲み込んできた。',
        ),
        b(
          'player',
          'player',
          'Then I will read the floor before I cross it. And when that seam opens again, I need to be close enough.',
          '先看清脚下哪些地方安全。得先靠过去，等它露出破绽再动手。',
          'なら、地面を読んでから進む。胸が再び開く時には、すぐそばにいなければ。',
        ),
        b(
          'scene',
          'boss',
          'The guardian settles its weight. Both lights burn steadily now. Somewhere beneath the armor, a smaller heartbeat waits.',
          '守卫向前踏了一步，地板随之一震。两处机关同时亮起，胸甲深处传来核心转动的声音。',
          '守護者が身構え、二つの灯りが定まる。厚い鎧の奥で、小さな鼓動が待っている。',
        ),
      ],
    }
  if (kind === 'brood')
    return {
      kind,
      title: t('Brood Queen', '育巢女王', '育巣の女王'),
      subtitle: t('A hunger with many mouths', '许多张嘴，同一种饥饿', '多くの口、ひとつの飢え'),
      sprite: 'brood-queen',
      prop: 'brood-nest',
      beats: [
        b(
          'scene',
          'field',
          'A thread catches your sleeve. Then another. In the dark beyond them, three nests pulse out of time with your heart.',
          '一根细丝挂住袖口，随后又是一根。更深的黑暗里，三座巢穴一鼓一缩，节拍与你的心跳错开。',
          '一本の糸が袖に絡み、また一本。奥では三つの巣が、心臓とは違う拍子で脈打っていた。',
        ),
        b(
          'boss',
          'boss',
          'Quiet feet. Warm blood. You have come a long way to feed us.',
          '脚步真轻，血却很暖。走了这么远，是来喂饱我们的吗？',
          '静かな足音、温かな血。遠くから私たちを満たしに来たのね。',
        ),
        b(
          'player',
          'boss',
          'The wound I made is closing. Something is flowing into her from those nests.',
          '刚划开的伤口又合上了。有什么东西，正从那些巢穴里流向她。',
          'つけた傷が塞がっていく。あの巣から何かが流れ込んでいる。',
        ),
        b(
          'scene',
          'objective',
          'An egg rolls from the nearest nest. A hairline crack appears in its shell; the queen’s plates draw tighter.',
          '最近的巢穴吐出一枚卵。卵壳裂开细缝，女王身上的甲片却扣得更紧了。',
          '近くの巣から卵が転がる。殻にひびが入り、女王の装甲はさらに固く閉じる。',
        ),
        b(
          'player',
          'objective',
          'The nests are more than nurseries. If one falls silent, perhaps she loses more than a child.',
          '这些巢不只是在孵卵。让其中一座安静下来，她失去的也许不只是一只幼虫。',
          '巣は卵を育てるだけではない。ひとつ沈黙させれば、幼体以上のものを失うはず。',
        ),
        b(
          'boss',
          'field',
          'Cut the silk if you like. My children already know where they will leap.',
          '想割丝就割吧。孩子们已经挑好了下一次扑向哪里。',
          '糸は切ってもいいわ。子どもたちはもう、次に飛びかかる場所を決めている。',
        ),
        b(
          'player',
          'player',
          'I can see their shadows gathering ahead of them. A clear lane, one nest at a time. And no eggs left at my heels.',
          '它们落脚前，影子已经先聚了过去。先清出一条路，一座巢一座巢来，别把快破壳的卵留在背后。',
          '着地する前に影が集まっている。道を開き、巣をひとつずつ。背後に孵りかけの卵は残さない。',
        ),
        b(
          'scene',
          'boss',
          'The queen lifts herself from the floor. Behind her, something small taps twice against a shell.',
          '女王缓缓抬离地面。她身后，有什么小东西在卵壳上敲了两下。',
          '女王が床から身を持ち上げる。その後ろで、小さな何かが殻を二度叩いた。',
        ),
      ],
    }
  if (kind === 'mirror')
    return {
      kind,
      title: t('Mirror Twins', '镜像双子', '鏡の双子'),
      subtitle: t('An answer on the other side', '答案在另一边', '答えは向こう側'),
      sprite: 'mirror-dawn',
      prop: 'mirror-dusk',
      beats: [
        b(
          'scene',
          'field',
          'Your reflection takes one more step after you stop. Amber light fills one chamber; blue moonlight fills another.',
          '你停下脚步，倒影却又向前走了一步。一间厅堂浸在琥珀色里，另一间落满冷蓝月光。',
          '足を止めても、鏡の自分はもう一歩進んだ。一方の広間は琥珀色、もう一方は青い月光。',
        ),
        b(
          'boss',
          'boss',
          'Which of us did you come to strike? Think carefully. We remember.',
          '你想攻击的是哪一个？想清楚。我们会记住的。',
          'どちらを打ちに来た？ よく考えろ。私たちは覚えている。',
        ),
        b(
          'player',
          'field',
          'The rooms share a shape, but not their dangers. A mine’s dull hum on this side becomes silence across the glass.',
          '两间房形状相同，危险却不重合。这边脚下的雷声，隔着镜面听过去，反而是一片寂静。',
          '部屋の形は同じでも危険は重ならない。こちらの地雷の響きは、鏡の向こうでは静寂になる。',
        ),
        b(
          'scene',
          'objective',
          'A seal glows in the amber room. Its light travels through the mirror and settles around the blue knight.',
          '琥珀厅里的封印亮了起来。光线穿过镜面，却缠绕在冷蓝的那位骑士身上。',
          '琥珀の部屋の封印が光る。光は鏡を抜け、青い騎士を包んだ。',
        ),
        b(
          'player',
          'objective',
          'Their protection comes from the other room. I cannot solve everything by staying here.',
          '原来，护住它的力量来自另一间房。一直待在这边，是解不开这个结的。',
          '守る力は反対側から来ている。ここに留まっていては、この結び目は解けない。',
        ),
        b(
          'boss',
          'boss',
          'A repeated blow is only an invitation to be reflected. We have danced this way for years.',
          '同样的攻击再来一次，只是在邀请我们把它还回去。这支舞，我们已经跳了很多年。',
          '同じ一撃を繰り返せば、跳ね返してほしいと言うようなもの。この踊りには慣れている。',
        ),
        b(
          'player',
          'player',
          'Then I change partners. Remember where I stood, carry each discovery across, and do not chase the same face twice.',
          '那就换一个舞伴。记住两边的落脚点，把发现带过去，别追着同一张脸连续出手。',
          'なら相手を替える。両側の足場を覚え、発見を運び、同じ顔を続けて追わない。',
        ),
        b(
          'scene',
          'field',
          'The mirror clears. Two paths wait, and somewhere between them your last footprint is still warm.',
          '镜面忽然清澈了。两条路同时等着你，其中一边，上一枚脚印还留着温度。',
          '鏡が澄み渡る。二つの道が待ち、片方にはまだ温かな足跡が残っていた。',
        ),
      ],
    }
  if (kind === 'magnetic')
    return {
      kind,
      title: t('Magnetic Knight', '磁力骑士', '磁力の騎士'),
      subtitle: t('Borrow the enemy’s strength', '借它的力量', '敵の力を借りる'),
      sprite: 'magnetic-knight',
      prop: 'magnetic-anchor',
      beats: [
        b(
          'scene',
          'field',
          'The needle in your compass turns sideways. Iron dust crawls across the tiles toward a motionless knight.',
          '指南针忽然横了过来。地砖上的铁屑像活了一样，缓缓爬向那位一动不动的骑士。',
          '方位針が横を向く。床の鉄粉が生き物のように、動かない騎士へ這っていく。',
        ),
        b(
          'boss',
          'boss',
          'Even your footsteps belong to my field. Come closer. Or let me choose where you stand.',
          '连你的脚步，都在我的领域里。走近些——或者，让我替你挑选落脚的地方。',
          'お前の足取りさえ、我が磁場の中。近づけ。さもなくば、立つ場所はこちらが選ぼう。',
        ),
        b(
          'player',
          'player',
          'My boots slide before I lift them. I can brace against the pull, but its armor will outlast my strength.',
          '还没抬脚，鞋底就先滑了出去。稳住身体能抵住这股力，可硬拼的话，先耗尽的一定是我。',
          '足を上げる前に靴が滑る。踏ん張れば引力には耐えられるが、正面から鎧を破る力はない。',
        ),
        b(
          'scene',
          'objective',
          'A buried anchor answers the pulse with a low bell note. Its numbered rim is scarred by old collisions.',
          '埋在地里的锚座回应着磁场，发出钟一样的低响。刻着数字的边缘，留着许多撞击的旧痕。',
          '地中の錨が磁場に応え、低い鐘の音を返す。数字の刻まれた縁には、古い衝突の傷がある。',
        ),
        b(
          'player',
          'objective',
          'Those scars… It has been drawn here before. If I clear the way and wake the anchor, the field might do the heavy work for me.',
          '这些撞痕……它以前就被吸过来。如果清出通路、唤醒锚座，也许能让它自己的磁场替我出力。',
          'この傷……以前にも引き寄せられたのか。道を開いて錨を起こせば、敵の磁場を借りられそうだ。',
        ),
        b(
          'boss',
          'field',
          'I hear that little anchor singing. When I answer, do not be in my way.',
          '我听见那座小锚在唱歌了。等我回应时，你最好别站在路上。',
          '小さな錨の歌が聞こえる。応える時、進路に立つなよ。',
        ),
        b(
          'player',
          'player',
          'The pull is gathering, not striking yet. There is time to withdraw. Far enough from the anchor, too—those cracked stones will not survive the impact.',
          '吸力正在聚拢，还没真正冲来。我还有撤开的时间。也得离锚座远一点——那些裂开的石块，可撑不住下一次撞击。',
          '力は集まりつつあるが、まだ来ない。退く時間はある。錨からも離れよう、あの石は衝撃に耐えられない。',
        ),
        b(
          'scene',
          'boss',
          'The knight closes its fists. For an instant, between two layers of armor, an unsteady light flickers.',
          '骑士握紧双拳。两层厚甲之间，一点不稳定的光闪了一下，随即又被遮住。',
          '騎士が拳を握る。二重の鎧の隙間で、不安定な光が一瞬だけ揺れた。',
        ),
      ],
    }
  return {
    kind,
    title: t('Clock Mage · Clepsydra', '时钟法师 · 漏刻', '時計の魔術師・漏刻'),
    subtitle: t('A moment left behind', '留下来的那一瞬', '残された一瞬'),
    sprite: 'clock-mage',
    prop: 'clock-hourglass',
    beats: [
      b(
        'scene',
        'field',
        'The last grain of sand falls upward. Your shadow arrives at the foot of the stairs a heartbeat after you do.',
        '最后一粒沙，向上落了回去。你已经走下楼梯，影子却迟了一拍才跟上。',
        '最後の砂粒が上へ落ちた。階段を下りても、影だけが一拍遅れてついてくる。',
      ),
      b(
        'boss',
        'boss',
        'Do not hurry. I have already reserved a moment for your defeat.',
        '别急。我已经替你的失败，预留好一个时刻。',
        '急ぐな。お前が敗れる時刻は、もう取ってある。',
      ),
      b(
        'scene',
        'field',
        'A mark appears beneath your feet. You shift aside; the mark stays where it was, patiently counting.',
        '脚下浮出一道刻印。你试着挪开半步，刻印却留在原处，安静地数着什么。',
        '足元に刻印が浮かぶ。半歩ずれても刻印は動かず、静かに何かを数えている。',
      ),
      b(
        'player',
        'player',
        'It has chosen a place and a time. Not me. If I leave before that moment, its certainty becomes an empty promise.',
        '它选定的是地点和时刻，不是我。只要在那之前离开，它笃定的预言，就只能落在空处。',
        '選んだのは場所と時刻で、私ではない。その前に離れれば、予言は空振りになる。',
      ),
      b(
        'scene',
        'player',
        'Your hand drops, but the outline it left behind finishes the motion. The mage glances at it, displeased.',
        '手已经收了回来，留在原地的轮廓却仍把动作做完。法师瞥了那道残影一眼，像是有些不悦。',
        '手を引いても、残った輪郭が動作を最後まで続ける。魔術師が不機嫌そうに残像を見た。',
      ),
      b(
        'player',
        'objective',
        'Something of each strike stays behind. And those hourglasses carry the same light as its spells. Perhaps their destination is not fixed forever.',
        '原来，出手之后还有一部分动作留在过去。那些沙漏，也亮着与法术相同的光……落点，也许并非不能改写。',
        '一撃の一部が過去に残る。砂時計は術と同じ光を放っている……行き先を書き換えられるかもしれない。',
      ),
      b(
        'boss',
        'objective',
        'Touch my clocks if you must. Borrowed time always finds someone to collect from.',
        '想碰我的钟，就碰吧。借来的时间，总要找一个人偿还。',
        '我が時計に触れるなら触れよ。借りた時間は、必ず誰かから取り立てる。',
      ),
      b(
        'player',
        'boss',
        'Then let it find its owner. One strike, a step away, and watch which moment arrives first.',
        '那就让它去找原来的主人。出手，离开，再看清究竟是哪一个时刻先到。',
        'なら持ち主のもとへ返そう。一撃、そして退く。どの瞬間が先に来るか見極める。',
      ),
    ],
  }
}
