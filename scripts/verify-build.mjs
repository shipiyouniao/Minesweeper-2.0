import { readFile, stat } from 'node:fs/promises'
import assert from 'node:assert/strict'

const html = await readFile('dist/index.html', 'utf8')
const assets = [...html.matchAll(/(?:src|href)="(\/Minesweeper-2\.0\/[^"?#]+)"/g)].map(match => match[1])
assert.ok(assets.some(path => path.endsWith('.js')), 'Missing JavaScript entry')
assert.ok(assets.some(path => path.endsWith('.css')), 'Missing stylesheet')
for (const asset of assets) await stat('dist/' + asset.replace('/Minesweeper-2.0/', ''))
for (const file of ['dist/assets/quiet-board.png', 'dist/favicon.svg', '.native/app/game/engine.js', '.native/app/game/engine.d.ts']) await stat(file)
assert.ok(!html.includes('/src/main.ts'), 'The site must consume native-emitted JavaScript')
console.log('GitHub Pages asset paths, generated artwork, native JavaScript and declarations verified.')
