import { spawnSync } from 'node:child_process'
import { copyDeclarations } from './lib/declarations.mjs'

const outputDirectory = process.argv[2] ?? '.native/app'
const result = spawnSync(
  process.execPath,
  [
    'node_modules/typescript/bin/tsc',
    '-p',
    'tsconfig.app.json',
    '--outDir',
    outputDirectory,
    ...process.argv.slice(3),
  ],
  { stdio: 'inherit' },
)

if (result.error) {
  throw result.error
}

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}

copyDeclarations(outputDirectory)
