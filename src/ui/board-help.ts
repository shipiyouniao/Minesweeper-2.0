import type { Language } from '../types/localization.js'
import type { BoardHelpCopy } from '../types/board-help.js'

/** Keep control instructions complete in each supported language. */
function boardHelpCopy(language: Language): BoardHelpCopy {
  if (language === 'zh')
    return {
      keyboard:
        '方向键 / H J K L 移动光标；Enter / 空格执行所选操作，F 插旗，S 标安全，C 快速开格。',
      note: '空心青色勾：疑似安全。选择“标安全”后点格子，再点一次取消。它是笔记，仍有可能是雷。',
      chord: '周围旗数等于数字时，选择“快速开格”再点数字，或按 C，翻开其余邻格。旗子插错也会踩雷。',
      expeditionChord:
        '快速开格沿已知道路逐格挖掘；Boss 战照常消耗行动点。够不到的格子留下安全笔记，踩雷后停止。',
      known: '金色旗：确认有雷；绿色实心点：确认安全。确认结果不能手动取消。',
      triggered: '红色地雷：已经踩过的雷，护盾挡下也会记录。雷仍在原处。',
      extensions: '键盘与鼠标扩展',
      vimium: 'Vimium 用户可按 i 暂时透传按键，或为本站设置排除规则；Esc 会退出透传。',
      gestures:
        '右键松开时插旗，拖动则取消。若扩展仍触发手势，请为本站关闭手势，也可用 F 或插旗按钮。',
      edge: 'Edge 内置手势由浏览器控制。若右拖仍会前进或后退，可在 Edge 设置中搜索“鼠标手势”并关闭。',
    }
  if (language === 'ja')
    return {
      keyboard:
        '矢印 / H J K L でカーソル移動。Enter / Space で選択中の操作、F で旗、S で安全メモ、C で周囲を開きます。',
      note: '水色の輪付きチェックは安全メモ。「安全メモ」を選んでマスを押し、もう一度押すと解除。地雷の可能性は残ります。',
      chord:
        '周囲の旗の数が数字と同じなら「周囲を開く」で数字を選ぶか C を押します。旗が間違っていれば地雷を踏みます。',
      expeditionChord:
        '既知の道を通って順番に掘ります。ボス戦では行動ポイントを消費し、届かないマスは安全メモに。地雷を踏むと停止します。',
      known: '金の旗は地雷確定、緑の点は安全確認済み。確認結果は手動で解除できません。',
      triggered: '赤い地雷は踏んだ場所です。シールドで防いでも記録され、地雷は残ります。',
      extensions: 'キーボード・マウス拡張機能',
      vimium:
        'Vimium は i でキーをページへ渡すか、このサイトを除外してください。Esc で透過モードを終了します。',
      gestures:
        '右ボタンを離すと旗、ドラッグすると取消。ブラウザーのジェスチャーが動く場合はこのサイトで無効にするか、F・旗ボタンを使ってください。',
      edge: 'Edge 内蔵のジェスチャーはブラウザー側の機能です。右ドラッグでページが移動する場合、Edge の設定で「マウス ジェスチャ」を検索して無効にできます。',
    }
  return {
    keyboard:
      'Arrows / H J K L move focus. Enter / Space use the selected mode; F flags, S toggles a safe note, C opens neighbors.',
    note: 'A cyan outlined check is a suspected-safe note. Choose Note safe and select a cell; repeat to remove it. The cell may still contain a mine.',
    chord:
      'When adjacent flags match a number, select Quick open and that number, or press C. Incorrect flags can still cause a mine hit.',
    expeditionChord:
      'Quick open follows known paths and reveals one cell at a time. Boss actions retain their AP cost. Unreachable cells receive notes; a mine hit stops the batch.',
    known:
      'Gold flags are confirmed mines; solid green dots are confirmed safe cells. Confirmed information cannot be removed manually.',
    triggered:
      'Red mines mark hazards you triggered, including hits absorbed by a shield. The mine remains in place.',
    extensions: 'Keyboard and mouse extensions',
    vimium:
      'With Vimium, press i to pass keys to the page, or exclude this site. Esc leaves pass-through mode.',
    gestures:
      'Release the right button to flag; dragging cancels. If browser gestures still run, disable them for this site in the browser or extension, or use F / the Flag button.',
    edge: 'Built-in Edge gestures are browser-controlled. If right drags still navigate, search Edge Settings for Mouse gesture and disable it.',
  }
}

/** Put detailed notation and extension guidance in help rather than above the board. */
export function boardHelpTemplate(language: Language, expedition = false): string {
  const t = boardHelpCopy(language)
  return `<div class="board-help"><p>${t.keyboard}</p><ul><li>${t.note}</li><li>${t.chord}</li>${expedition ? `<li>${t.expeditionChord}</li><li>${t.known}</li><li>${t.triggered}</li>` : ''}</ul><details><summary>${t.extensions}</summary><p>${t.vimium}</p><p>${t.gestures}</p><p>${t.edge}</p></details></div>`
}
