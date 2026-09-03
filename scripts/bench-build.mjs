import { appendFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpus, platform, arch, release, totalmem } from 'node:os'
import { resolve, sep } from 'node:path'
import { buildPipeline } from './lib/build-pipeline.mjs'

const argument = process.argv.indexOf('--runs')
const runs = argument < 0 ? 6 : Number(process.argv[argument + 1])

if (!Number.isInteger(runs) || runs < 3 || runs > 20) {
  throw new Error('--runs must be an integer from 3 to 20')
}

/** Read repository identity without sending paths or other local environment details to reports. */
function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim()
}

/** Fingerprint all build/test inputs, normalizing text newlines across Windows and Linux. */
async function inputFingerprint() {
  const names = git(
    'ls-files',
    '--cached',
    '--others',
    '--exclude-standard',
    '--',
    'src',
    'tests',
    'scripts',
    'public',
    'index.html',
    'package.json',
    'package-lock.json',
    'vite.config.ts',
    'tsconfig*.json',
    '.github/workflows',
    '.prettierrc.json',
    '.prettierignore',
  )
    .split('\n')
    .filter(Boolean)
    .sort()
  const hash = createHash('sha256')

  for (const name of names) {
    const raw = await readFile(name)
    const content = /\.(png|ico)$/.test(name) ? raw : raw.toString('utf8').replaceAll('\r\n', '\n')
    hash.update(name + '\0')
    hash.update(content)
    hash.update('\0')
  }

  return { sha256: hash.digest('hex'), files: names }
}

/** Delete only known generated variant/cache folders after verifying their absolute boundaries. */
async function cleanVariant(variant) {
  const root = resolve('.bench/ab')

  for (const directory of [variant, `cache-${variant}`]) {
    if (!['legacy', 'native', 'cache-legacy', 'cache-native'].includes(directory)) {
      throw new Error('Refusing to clean an unknown benchmark directory')
    }

    const target = resolve(root, directory)

    if (!target.startsWith(root + sep)) {
      throw new Error('Benchmark output escaped its generated directory')
    }

    await rm(target, { recursive: true, force: true })
  }
}

/** Compute the median, averaging the middle pair when the sample count is even. */
function median(values) {
  const sorted = [...values].sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)

  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

/** Summarize phase medians and the distribution of complete-build wall times. */
function summarize(samples) {
  const total = samples.map((sample) => sample.totalMs)

  return {
    checkMs: median(samples.map((sample) => sample.check.milliseconds)),
    emitMs: median(samples.map((sample) => sample.emit?.milliseconds ?? 0)),
    bundleMs: median(samples.map((sample) => sample.bundle.milliseconds)),
    totalMs: median(total),
    totalMinMs: Math.min(...total),
    totalMaxMs: Math.max(...total),
    artifacts: samples.at(-1).artifacts,
  }
}

/** Format measured milliseconds as seconds without hiding the full samples in JSON. */
function seconds(milliseconds) {
  return (milliseconds / 1000).toFixed(3)
}

/** Generate the same report for local inspection, downloadable CI artifacts, and the job summary. */
function markdown(report) {
  const { legacy, native } = report.summary

  return `# TypeScript build A/B measurement

- Measured commit: \`${report.commit}\`; worktree dirty: \`${report.dirty}\`.
- Build-input SHA-256: \`${report.inputs.sha256}\`.
- Environment: ${report.environment.platform} ${report.environment.arch}, Node ${report.environment.node}, ${report.environment.cpu}, ${report.environment.logicalCpus} logical CPUs.
- Toolchain: TypeScript ${report.versions.legacy} / ${report.versions.native}, Vite ${report.versions.vite}.
- ${report.runs} measured runs per variant, alternating A/B and B/A; one excluded warm-up per variant.
- Fresh output directories, Vite caches, and compiler/bundler processes per sample. Filesystem/OS caches are not flushed; package installation is excluded.

| Variant | Check median | Emit median | Vite median | Total median | Total min–max |
| --- | ---: | ---: | ---: | ---: | ---: |
| A: TS6 check + Vite source | ${seconds(legacy.checkMs)} s | — | ${seconds(legacy.bundleMs)} s | ${seconds(legacy.totalMs)} s | ${seconds(legacy.totalMinMs)}–${seconds(legacy.totalMaxMs)} s |
| B: TS7 check + emit + Vite JS | ${seconds(native.checkMs)} s | ${seconds(native.emitMs)} s | ${seconds(native.bundleMs)} s | ${seconds(native.totalMs)} s | ${seconds(native.totalMinMs)}–${seconds(native.totalMaxMs)} s |

| Variant | JS bytes | JS gzip bytes | CSS bytes | Total artifact bytes |
| --- | ---: | ---: | ---: | ---: |
| A | ${legacy.artifacts.javascriptBytes} | ${legacy.artifacts.javascriptGzipBytes} | ${legacy.artifacts.cssBytes} | ${legacy.artifacts.totalBytes} |
| B | ${native.artifacts.javascriptBytes} | ${native.artifacts.javascriptGzipBytes} | ${native.artifacts.cssBytes} | ${native.artifacts.totalBytes} |

The B/A ratio of total medians is **${(native.totalMs / legacy.totalMs).toFixed(3)}** for this run. Phase medians need not sum to the total median. B includes native JavaScript, source-map, and declaration emission; A does not emit declarations. These are complete workflow costs, not an isolated compiler speed comparison or a browser-runtime benchmark.

Every sample passed type checking, bundling, and artifact-path verification. Raw samples, phase diagnostics, environment metadata, and artifact inventories are recorded in the accompanying JSON. Timing noise and workload size limit generalization.
`
}

const inputs = await inputFingerprint()
const packageVersion = async (name) =>
  JSON.parse(await readFile(`node_modules/${name}/package.json`, 'utf8')).version
const report = {
  generatedAt: new Date().toISOString(),
  commit: git('rev-parse', 'HEAD'),
  dirty: git('status', '--porcelain').length > 0,
  inputs,
  runs,
  environment: {
    platform: platform(),
    arch: arch(),
    release: release(),
    node: process.version,
    cpu: cpus()[0]?.model ?? 'unknown',
    logicalCpus: cpus().length,
    memoryBytes: totalmem(),
    githubActions: process.env.GITHUB_ACTIONS === 'true',
    runnerImage: process.env.ImageOS ?? null,
    runnerImageVersion: process.env.ImageVersion ?? null,
  },
  versions: {
    legacy: await packageVersion('typescript-legacy'),
    native: await packageVersion('typescript'),
    vite: await packageVersion('vite'),
  },
  samples: { legacy: [], native: [] },
}

for (const variant of ['legacy', 'native']) {
  await cleanVariant(variant)
  await buildPipeline(variant)
  console.log(`Warm-up complete: ${variant} (excluded)`)
}

for (let round = 0; round < runs; round++) {
  const order = round % 2 === 0 ? ['legacy', 'native'] : ['native', 'legacy']

  for (const variant of order) {
    await cleanVariant(variant)
    const sample = await buildPipeline(variant)
    report.samples[variant].push({
      round: round + 1,
      position: order.indexOf(variant) + 1,
      ...sample,
    })
    console.log(`Round ${round + 1}/${runs}: ${variant} ${seconds(sample.totalMs)} s`)
  }
}

if ((await inputFingerprint()).sha256 !== inputs.sha256) {
  throw new Error('Build inputs changed during measurement; discard these samples')
}

report.summary = {
  legacy: summarize(report.samples.legacy),
  native: summarize(report.samples.native),
}

await mkdir('.bench/ab', { recursive: true })
await writeFile('.bench/ab/results.json', JSON.stringify(report, null, 2) + '\n')
await writeFile('.bench/ab/report.md', markdown(report))

if (process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(process.env.GITHUB_STEP_SUMMARY, markdown(report))
}

console.log(markdown(report))
