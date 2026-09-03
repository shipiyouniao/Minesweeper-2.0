import { spawnSync } from 'node:child_process'
import { readFile, readdir, stat } from 'node:fs/promises'
import { performance } from 'node:perf_hooks'
import { gzipSync } from 'node:zlib'
import { join } from 'node:path'
import assert from 'node:assert/strict'

/** Explicit paths prevent the legacy alias's tsc bin from selecting the wrong compiler. */
export const COMPILERS = {
  legacy: 'node_modules/typescript-legacy/bin/tsc',
  native: 'node_modules/typescript/bin/tsc',
}

/** Run one fresh process, fail on errors/timeouts, and measure startup-inclusive wall time. */
export function timedCommand(script, args) {
  const start = performance.now()
  const result = spawnSync(process.execPath, [script, ...args], {
    encoding: 'utf8',
    timeout: 120000,
    maxBuffer: 8 * 1024 * 1024,
  })
  const milliseconds = performance.now() - start

  if (result.error || result.status !== 0) {
    throw new Error(result.error?.message ?? result.stdout + result.stderr)
  }

  return { milliseconds, diagnostics: result.stdout + result.stderr }
}

/** Build either conventional Vite/TS6 or native TS7 emission followed by the same Vite. */
export async function buildPipeline(variant) {
  if (!Object.hasOwn(COMPILERS, variant)) {
    throw new Error('Build variant must be legacy or native')
  }

  const start = performance.now()
  const check = timedCommand(COMPILERS[variant], ['-p', 'tsconfig.json', '--extendedDiagnostics'])
  const emit =
    variant === 'native'
      ? timedCommand(COMPILERS.native, [
          '-p',
          'tsconfig.app.json',
          '--outDir',
          '.bench/ab/native/app',
          '--extendedDiagnostics',
        ])
      : null
  const bundle = timedCommand('node_modules/vite/bin/vite.js', ['build', '--mode', `ab-${variant}`])
  const totalMs = performance.now() - start

  // File verification and compression accounting are outside build timing.
  const artifacts = await inspectArtifacts(`.bench/ab/${variant}/dist`)

  if (variant === 'native') {
    await stat('.bench/ab/native/app/game/engine.js')
    await stat('.bench/ab/native/app/game/engine.d.ts')
  }

  return { variant, check, emit, bundle, totalMs, artifacts }
}

/** Enumerate artifact files recursively in stable path order for reproducible reports. */
async function filesIn(directory, relative = '') {
  const files = []

  for (const entry of await readdir(join(directory, relative), { withFileTypes: true })) {
    const path = join(relative, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await filesIn(directory, path)))
    } else {
      files.push(path)
    }
  }

  return files.sort()
}

/** Verify a complete Pages artifact and report actual JS/CSS/total file sizes. */
export async function inspectArtifacts(directory) {
  const html = await readFile(join(directory, 'index.html'), 'utf8')
  const paths = [...html.matchAll(/(?:src|href)="(\/Minesweeper-2\.0\/[^"?#]+)"/g)].map((match) =>
    match[1].replace('/Minesweeper-2.0/', ''),
  )

  assert.ok(
    paths.some((path) => path.endsWith('.js')),
    'Missing bundled JavaScript',
  )
  assert.ok(
    paths.some((path) => path.endsWith('.css')),
    'Missing bundled stylesheet',
  )
  assert.ok(!html.includes('/src/main.ts'), 'Source entry leaked into production HTML')

  for (const path of [
    ...paths,
    'assets/quiet-board.png',
    'favicon.svg',
    'game.html',
    'menu.html',
  ]) {
    await stat(join(directory, path))
  }

  const files = []

  for (const path of await filesIn(directory)) {
    const bytes = await readFile(join(directory, path))
    const compressible = /\.(js|css)$/.test(path)

    files.push({
      path: path.replaceAll('\\', '/'),
      bytes: bytes.length,
      gzipBytes: compressible ? gzipSync(bytes).length : null,
    })
  }

  /** Sum a measured property for files matching the requested asset extension. */
  const sum = (extension, field) =>
    files
      .filter((file) => file.path.endsWith(extension))
      .reduce((total, file) => total + (file[field] ?? 0), 0)

  return {
    files,
    totalBytes: files.reduce((total, file) => total + file.bytes, 0),
    javascriptBytes: sum('.js', 'bytes'),
    javascriptGzipBytes: sum('.js', 'gzipBytes'),
    cssBytes: sum('.css', 'bytes'),
    cssGzipBytes: sum('.css', 'gzipBytes'),
  }
}
