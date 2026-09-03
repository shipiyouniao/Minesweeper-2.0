import { spawn, spawnSync } from 'node:child_process'

const compiler = 'node_modules/typescript/bin/tsc'
const initial = spawnSync(process.execPath, [compiler, '-p', 'tsconfig.app.json'], { stdio: 'inherit' })
if (initial.status !== 0) process.exit(initial.status ?? 1)
const children = [
  spawn(process.execPath, [compiler, '-p', 'tsconfig.app.json', '--watch', '--preserveWatchOutput'], { stdio: 'inherit' }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js', ...process.argv.slice(2)], { stdio: 'inherit' }),
]
let stopping = false
function stop(code = 0) {
  if (stopping) return
  stopping = true
  for (const child of children) child.kill()
  process.exit(code)
}
for (const child of children) child.on('exit', code => stop(code ?? 0))
process.on('SIGINT', () => stop())
process.on('SIGTERM', () => stop())
