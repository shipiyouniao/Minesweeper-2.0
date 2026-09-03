import { copyFileSync, mkdirSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/** Copy authored module declarations, which TypeScript checks but does not emit. */
export function copyDeclarations(outputDirectory) {
  const target = join(outputDirectory, 'types')
  mkdirSync(target, { recursive: true })

  for (const file of readdirSync('src/types')) {
    if (file.endsWith('.d.ts')) {
      copyFileSync(join('src/types', file), join(target, file))
    }
  }
}
