import { mkdir, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { performance } from 'node:perf_hooks'
import { platform, arch } from 'node:os'

const argument = process.argv.indexOf('--files')
const count = argument < 0 ? 1000 : Number(process.argv[argument + 1])
if (!Number.isInteger(count) || count < 1 || count > 20000)
  throw new Error('--files must be an integer from 1 to 20000')
const compiler = 'node_modules/typescript/bin/tsc'
const version = spawnSync(process.execPath, [compiler, '--version'], {
  encoding: 'utf8',
}).stdout.trim()
await mkdir('.bench', { recursive: true })
const report = {
  compiler: version,
  platform: platform(),
  arch: arch(),
  node: process.version,
  generatedAt: new Date().toISOString(),
  results: [],
}

/** Collect three successful fresh-process samples and retain the final native diagnostics. */
function measure(label, project) {
  const samples = []
  let diagnostics = ''
  for (let run = 0; run < 3; run++) {
    const start = performance.now()
    const result = spawnSync(process.execPath, [compiler, '-p', project, '--extendedDiagnostics'], {
      encoding: 'utf8',
      timeout: 120000,
    })
    if (result.error || result.status !== 0)
      throw new Error(result.error?.message ?? result.stdout + result.stderr)
    samples.push(Math.round(performance.now() - start))
    diagnostics = result.stdout
  }
  const medianMs = [...samples].sort((a, b) => a - b)[1]
  report.results.push({ label, samplesMs: samples, medianMs, diagnostics })
  console.log(`${label}: ${samples.join(' / ')} ms (median ${medianMs} ms)`)
}

measure('Real application, tests and Vite config', 'tsconfig.json')
for (const files of [...new Set([Math.min(250, count), count])]) {
  const folder = `.bench/stress-${files}`
  await mkdir(folder, { recursive: true })
  const imports = [],
    events = []
  for (let i = 0; i < files; i++) {
    const fields = Array.from(
      { length: 40 },
      (_, j) =>
        `  field_${i}_${j}: { readonly id: string; state: 'hidden' | 'revealed' | 'flagged'; value: number; tags: readonly string[] }`,
    ).join('\n')
    await writeFile(
      `${folder}/model-${i}.ts`,
      `export interface Model${i} {\n${fields}\n}\nexport type Event${i} = { [K in keyof Model${i}]: { type: K; value: Readonly<Model${i}[K]> } }[keyof Model${i}];\nexport function identity${i}(event: Event${i}): Event${i} { return event }\n`,
    )
    imports.push(`import type { Event${i} } from './model-${i}.js'`)
    events.push(`Event${i}`)
  }
  await writeFile(
    `${folder}/index.ts`,
    `${imports.join('\n')}\nexport type AllEvents = ${events.join(' | ')};\nexport type ByType = { [E in AllEvents as E['type']]: E['value'] };\nexport declare const values: ByType;\n`,
  )
  await writeFile(
    `${folder}/tsconfig.json`,
    JSON.stringify(
      {
        compilerOptions: {
          strict: true,
          noEmit: true,
          target: 'ES2023',
          module: 'ESNext',
          moduleResolution: 'Bundler',
          types: [],
          skipLibCheck: false,
        },
        include: ['*.ts'],
      },
      null,
      2,
    ),
  )
  measure(
    `${files} generated modules, ${files * 40} mapped event variants`,
    `${folder}/tsconfig.json`,
  )
  if (files === count) {
    await writeFile(
      `${folder}/tsconfig.modular.json`,
      JSON.stringify(
        {
          compilerOptions: {
            strict: true,
            noEmit: true,
            target: 'ES2023',
            module: 'ESNext',
            moduleResolution: 'Bundler',
            types: [],
            skipLibCheck: false,
          },
          include: ['model-*.ts'],
        },
        null,
        2,
      ),
    )
    measure(
      `${files} modules without the cross-module mega-union`,
      `${folder}/tsconfig.modular.json`,
    )
  }
}

// The experiment must still report real type errors instead of merely emitting JS.
await mkdir('.bench/negative', { recursive: true })
await writeFile('.bench/negative/bad.ts', 'export const mineCount: number = "not a number";\n')
await writeFile(
  '.bench/negative/tsconfig.json',
  JSON.stringify({ compilerOptions: { strict: true, noEmit: true, types: [] }, files: ['bad.ts'] }),
)
const negative = spawnSync(process.execPath, [compiler, '-p', '.bench/negative/tsconfig.json'], {
  encoding: 'utf8',
})
if (negative.status === 0 || !negative.stdout.includes('TS2322'))
  throw new Error('Native compiler failed the negative type-error probe')
report.negativeProbe = 'TS2322 correctly rejected'
await writeFile('.bench/results.json', JSON.stringify(report, null, 2) + '\n')
console.log('Negative type-error probe passed. Full diagnostics saved to .bench/results.json.')
console.log(
  'These are local scale samples, not a compiler limit or a comparison with TypeScript 6.',
)
