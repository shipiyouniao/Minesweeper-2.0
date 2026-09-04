import { readFile, readdir, stat } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import assert from 'node:assert/strict'

const html = await readFile('dist/index.html', 'utf8')
const assets = [...html.matchAll(/(?:src|href)="(\/Minesweeper-2\.0\/[^"?#]+)"/g)].map(
  (match) => match[1],
)
assert.ok(
  assets.some((path) => path.endsWith('.js')),
  'Missing JavaScript entry',
)
assert.ok(
  assets.some((path) => path.endsWith('.css')),
  'Missing stylesheet',
)
for (const asset of assets) await stat('dist/' + asset.replace('/Minesweeper-2.0/', ''))
for (const file of [
  'dist/assets/quiet-board.png',
  'dist/favicon.svg',
  '.native/app/game/engine.js',
  '.native/app/game/engine.d.ts',
])
  await stat(file)
for (const sprite of [
  'player',
  'surveyor',
  'engineer',
  'entrance',
  'exit',
  'treasure',
  'wall',
  'probe',
  'scanner',
  'shield',
  'mine',
]) {
  const source = await readFile(`public/assets/dungeon/${sprite}.png`)
  assert.deepEqual(
    await readFile(`dist/assets/dungeon/${sprite}.png`),
    source,
    `Missing or altered dungeon sprite: ${sprite}`,
  )
}
assert.ok(!html.includes('/src/main.ts'), 'The site must consume native-emitted JavaScript')

// Check the emitted declaration graph independently of src, catching missing copied contracts.
const declarations = (await readdir('.native/app', { recursive: true }))
  .filter((file) => file.endsWith('.d.ts'))
  .map((file) => `.native/app/${file}`)

for (const file of await readdir('src/types')) {
  assert.equal(
    await readFile(`.native/app/types/${file}`, 'utf8'),
    await readFile(`src/types/${file}`, 'utf8'),
    `Outdated or missing declaration: ${file}`,
  )
}

const checked = spawnSync(
  process.execPath,
  [
    'node_modules/typescript/bin/tsc',
    '--ignoreConfig',
    '--noEmit',
    '--strict',
    '--target',
    'es2023',
    '--module',
    'esnext',
    '--moduleResolution',
    'bundler',
    '--types',
    'vite/client',
    ...declarations,
  ],
  { stdio: 'inherit' },
)

assert.equal(
  checked.status,
  0,
  'Generated declarations must resolve without importing source files',
)
console.log(
  'GitHub Pages asset paths, generated artwork, native JavaScript and declarations verified.',
)
