import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { randomInt } from 'node:crypto'
import { resolve, extname, sep } from 'node:path'
import { battleFixture } from '../tests/browser/battle-fixtures.mjs'

// Accepted journal prefixes exercise the production UI; the published game has no debug switch.
let seed = 55
let fixture = battleFixture(seed)
const root = resolve('dist')
const port = Number(process.env.TIDE_DEMO_PORT || 4819)
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
}
const page = `<!doctype html><html lang="zh"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>执潮者 · 试玩</title>
<style>*{box-sizing:border-box}html,body{margin:0;height:100%;background:#f5f4ef;color:#354b46;font:14px system-ui}body{display:flex;flex-direction:column}header{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:10px 14px;border-bottom:1px solid #d9dfd6}strong{margin-right:auto}button{font:inherit;border:1px solid #cdd8cf;border-radius:8px;padding:7px 10px;background:#fff;color:inherit;cursor:pointer}button:focus-visible{outline:2px solid #36858d}button:disabled{opacity:.5}iframe{width:100%;flex:1;border:0;min-height:0}#status{font-size:12px;width:100%;color:#6a7c73}</style></head>
<body><header><strong>执潮者 · 标准难度试玩</strong><button data-scene="entry">重开本局</button><button data-scene="new">新棋盘</button><button data-scene="anchor">体验落锚</button><button data-scene="wave">体验反流</button><span id="status"></span></header><iframe title="执潮者战斗" allow="autoplay"></iframe>
<script type="module">
const frame=document.querySelector('iframe'),buttons=[...document.querySelectorAll('button')],status=document.querySelector('#status');
const game='/Minesweeper-2.0/?ruleset=expedition&lang='+(new URLSearchParams(location.search).get('lang')||'zh');
/** Stop the previous local game before replacing this preview origin's fixture journal. */
async function start(scene){
 buttons.forEach(button=>button.disabled=true);status.textContent='正在准备棋盘…';
 try{
  const response=await fetch('/demo-save/'+scene);if(!response.ok)throw new Error('试玩准备失败');const data=await response.json();
  if(frame.hasAttribute('src'))await new Promise(resolve=>{frame.onload=resolve;frame.src='about:blank'});
  localStorage.setItem('minesweeper.variants.v1.expedition',JSON.stringify(data.save));
  frame.onload=()=>{status.textContent='棋盘 '+data.seed+(scene==='anchor'?' · 选落锚，再点第 '+data.row+' 行、第 '+data.column+' 列。':scene==='wave'?' · 点击结束回合，观察潮水反流。':'')};frame.src=game;
 }catch(error){status.textContent=error.message}finally{buttons.forEach(button=>button.disabled=false)}
}
buttons.forEach(button=>button.addEventListener('click',()=>start(button.dataset.scene)));start(new URLSearchParams(location.search).get('scene')||'entry');
</script></body></html>`

/** Serve the local trial and built assets strictly below dist. */
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://127.0.0.1:${port}`)
    response.setHeader('Cache-Control', 'no-store')
    if (url.pathname === '/')
      return response.writeHead(200, { 'Content-Type': mime['.html'] }).end(page)
    if (url.pathname.startsWith('/demo-save/')) {
      const scene = url.pathname.slice('/demo-save/'.length)
      if (scene === 'new') {
        seed = randomInt(100000) * 8 + 7
        fixture = battleFixture(seed)
      }
      const current =
        scene === 'anchor'
          ? fixture.anchor
          : scene === 'wave'
            ? fixture.objective
            : scene === 'entry' || scene === 'new'
              ? fixture.entered
              : null
      if (!current) return response.writeHead(404).end()
      const index = current.action?.index ?? 0
      return response.writeHead(200, { 'Content-Type': 'application/json' }).end(
        JSON.stringify({
          save: current.save,
          seed,
          row: Math.floor(index / current.run.game.config.width) + 1,
          column: (index % current.run.game.config.width) + 1,
        }),
      )
    }
    const prefix = '/Minesweeper-2.0/'
    if (!url.pathname.startsWith(prefix)) return response.writeHead(404).end()
    const file = resolve(
      root,
      decodeURIComponent(url.pathname.slice(prefix.length)) || 'index.html',
    )
    if (!file.startsWith(root + sep)) return response.writeHead(403).end()
    response
      .writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' })
      .end(await readFile(file))
  } catch {
    response.writeHead(500).end('Unable to prepare the local trial')
  }
})
server.listen(port, '127.0.0.1', () => console.log(`Tidekeeper trial: http://127.0.0.1:${port}/`))
