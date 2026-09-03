import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import ts from 'typescript-legacy'

const failures = []

/** Enforce this project's explicit-contract convention using syntax, not text matches. */
async function inspect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)

    if (entry.isDirectory()) {
      await inspect(path)
      continue
    }

    if (!path.endsWith('.ts')) {
      continue
    }

    const file = ts.createSourceFile(
      path,
      await readFile(path, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
    )

    if (file.isDeclarationFile && !ts.isExternalModule(file)) {
      failures.push(`${path}: declarations must be module scoped`)
    }

    /** Reject wide escape hatches and indirect type construction in application contracts. */
    function visit(node) {
      const declaration = ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)
      const wide =
        node.kind === ts.SyntaxKind.AnyKeyword || node.kind === ts.SyntaxKind.UnknownKeyword
      const computed = ts.isMappedTypeNode(node) || ts.isConditionalTypeNode(node)

      if ((declaration && !file.isDeclarationFile) || wide || computed) {
        const location = file.getLineAndCharacterOfPosition(node.getStart(file))
        failures.push(
          `${path}:${location.line + 1}: use an explicit .d.ts contract or concrete union`,
        )
      }

      ts.forEachChild(node, visit)
    }

    visit(file)
  }
}

await inspect('src')

if (failures.length) {
  throw new Error(failures.join('\n'))
}

console.log('Module declarations and explicit application types verified.')
