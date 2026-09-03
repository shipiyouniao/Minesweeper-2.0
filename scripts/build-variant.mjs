import { mkdir, writeFile } from 'node:fs/promises'
import { buildPipeline } from './lib/build-pipeline.mjs'

const variant = process.argv[2]
const result = await buildPipeline(variant)

await mkdir('.bench/ab', { recursive: true })
await writeFile(`.bench/ab/last-${variant}.json`, JSON.stringify(result, null, 2) + '\n')

console.log(
  `${variant}: check ${result.check.milliseconds.toFixed(0)} ms, ` +
    `emit ${(result.emit?.milliseconds ?? 0).toFixed(0)} ms, ` +
    `bundle ${result.bundle.milliseconds.toFixed(0)} ms, total ${result.totalMs.toFixed(0)} ms`,
)
