import { readdir, readFile } from 'node:fs/promises'
import { join, dirname, resolve, relative } from 'node:path'
import ts from 'typescript-legacy'

const failures = []

/** Documentation belongs to named behavior; inline collection callbacks inherit their owner's intent. */
function documentedBehavior(node) {
  if (
    ts.isFunctionDeclaration(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isConstructorDeclaration(node) ||
    ts.isGetAccessorDeclaration(node) ||
    ts.isSetAccessorDeclaration(node)
  )
    return node
  if (
    (ts.isVariableDeclaration(node) || ts.isPropertyDeclaration(node)) &&
    node.initializer &&
    (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))
  )
    return ts.isVariableDeclaration(node) ? node.parent.parent : node
  return null
}

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

      const behavior = documentedBehavior(node)
      if (!file.isDeclarationFile && behavior && !ts.getJSDocCommentsAndTags(behavior).length) {
        const location = file.getLineAndCharacterOfPosition(node.getStart(file))
        failures.push(`${path}:${location.line + 1}: document the purpose of named behavior`)
      }

      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        const from = path.replaceAll('\\', '/')
        const target = relative('.', resolve(dirname(path), node.moduleSpecifier.text)).replaceAll(
          '\\',
          '/',
        )
        if (
          (from.startsWith('src/game/') &&
            /^src\/(ui|application|persistence|platform)\//.test(target)) ||
          (from.startsWith('src/application/') && target.startsWith('src/ui/'))
        )
          failures.push(
            `${path}: domain/application code cannot depend on outer UI or browser adapters`,
          )
      }

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

console.log(
  'Explicit declaration contracts, named behavior comments and inward dependency boundaries verified.',
)
