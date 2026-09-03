import { spawn, spawnSync } from 'node:child_process'
import { watch } from 'node:fs'
import { copyDeclarations } from './lib/declarations.mjs'

const compiler = 'node_modules/typescript/bin/tsc'
const initial = spawnSync(process.execPath, ['scripts/compile.mjs'], {
  stdio: 'inherit',
})
if (initial.status !== 0) process.exit(initial.status ?? 1)
const children = [
  spawn(
    process.execPath,
    [compiler, '-p', 'tsconfig.app.json', '--watch', '--preserveWatchOutput'],
    { stdio: 'inherit' },
  ),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js', ...process.argv.slice(2)], {
    stdio: 'inherit',
  }),
]
let stopping = false
const declarations = watch('src/types', () => copyDeclarations('.native/app'))
declarations.on('error', () => stop(1))
/** Stop both child processes together so a failed watcher cannot leave a stale server. */
function stop(code = 0) {
  if (stopping) return
  stopping = true
  declarations.close()
  for (const child of children) child.kill()
  process.exit(code)
}
for (const child of children) child.on('exit', (code) => stop(code ?? 0))
process.on('SIGINT', () => stop())
process.on('SIGTERM', () => stop())
