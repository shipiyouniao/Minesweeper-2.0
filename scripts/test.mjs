import { rmSync, readdirSync } from 'node:fs'
import { resolve, dirname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const legacy = process.argv.includes('--legacy')
const output = resolve(root, '.native', legacy ? 'tests-legacy' : 'tests')
const generatedRoot = resolve(root, '.native') + sep

// Remove only this compiler's generated tests so deleted source files cannot run again.
if (!output.startsWith(generatedRoot))
  throw new Error('Test output escaped the generated directory')
rmSync(output, { recursive: true, force: true })
execFileSync(
  process.execPath,
  [
    resolve(root, 'node_modules', legacy ? 'typescript-legacy' : 'typescript', 'bin/tsc'),
    '-p',
    'tsconfig.test.json',
    '--outDir',
    output,
  ],
  { cwd: root, stdio: 'inherit' },
)

const tests = readdirSync(resolve(output, 'tests'))
  .filter((name) => name.endsWith('.test.js'))
  .sort()
  .map((name) => resolve(output, 'tests', name))
if (!tests.length) throw new Error('No behavior tests were emitted')
execFileSync(process.execPath, ['--test', ...tests], { cwd: root, stdio: 'inherit' })
