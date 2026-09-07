import { readdir, readFile } from 'node:fs/promises'
import ts from 'typescript-legacy'

const failures = []
/** Read literal catalogs without executing application code. */
async function catalog(language) {
  const filename = `src/locales/${language}.ts`
  const source = ts.createSourceFile(
    filename,
    await readFile(filename, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  )
  const declaration = source.statements.find(ts.isVariableStatement)?.declarationList
    .declarations[0]
  if (!declaration || !ts.isObjectLiteralExpression(declaration.initializer))
    throw new Error(`Invalid catalog: ${filename}`)
  return Object.fromEntries(
    declaration.initializer.properties.map((property) => {
      if (!ts.isPropertyAssignment(property) || !ts.isStringLiteral(property.initializer))
        throw new Error(`Catalog messages must be plain strings: ${filename}`)
      return [property.name.text, property.initializer.text]
    }),
  )
}
/** Compare named fields independently of their order or repetition in a translation. */
function parameters(text) {
  return [
    ...new Set([...text.matchAll(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g)].map((match) => match[1])),
  ].sort()
}
const catalogs = await Promise.all(['en', 'zh', 'ja'].map(catalog))
const [english] = catalogs
for (const [index, messages] of catalogs.entries()) {
  if (JSON.stringify(Object.keys(messages).sort()) !== JSON.stringify(Object.keys(english).sort()))
    failures.push(`Locale ${index}: missing or extra keys`)
  for (const [key, text] of Object.entries(messages)) {
    if (!text.trim()) failures.push(`${key}: empty translation`)
    if (JSON.stringify(parameters(text)) !== JSON.stringify(parameters(english[key] ?? '')))
      failures.push(`${key}: translated parameter names differ`)
  }
}
/** Enforce catalog calls and prevent new inline multilingual copy in UI modules. */
for (const file of await readdir('src/ui')) {
  if (!file.endsWith('.ts')) continue
  const filename = `src/ui/${file}`
  const text = await readFile(filename, 'utf8')
  const source = ts.createSourceFile(filename, text, ts.ScriptTarget.Latest, true)
  const functions = new Set()
  for (const node of source.statements)
    if (
      ts.isImportDeclaration(node) &&
      node.moduleSpecifier.text === '../i18n.js' &&
      node.importClause?.namedBindings &&
      ts.isNamedImports(node.importClause.namedBindings)
    ) {
      for (const binding of node.importClause.namedBindings.elements)
        if ((binding.propertyName?.text ?? binding.name.text) === 'message')
          functions.add(binding.name.text)
    }
  function visit(node) {
    if (
      (ts.isStringLiteral(node) ||
        ts.isNoSubstitutionTemplateLiteral(node) ||
        ts.isTemplateHead(node) ||
        ts.isTemplateMiddle(node) ||
        ts.isTemplateTail(node)) &&
      /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(node.text)
    )
      failures.push(`${filename}: move multilingual text into src/locales`)
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      functions.has(node.expression.text)
    ) {
      const key = node.arguments[1]
      if (!key || !ts.isStringLiteral(key) || !Object.hasOwn(english, key.text))
        failures.push(`${filename}: use a declared literal message key`)
      else {
        const args = node.arguments[2]
        const supplied =
          args && ts.isObjectLiteralExpression(args)
            ? args.properties.map((p) => p.name?.getText(source)).sort()
            : []
        if (JSON.stringify(supplied) !== JSON.stringify(parameters(english[key.text])))
          failures.push(`${filename}: ${key.text} has missing or extra parameters`)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
}
if (failures.length) {
  console.error(failures.join('\n'))
  process.exitCode = 1
} else
  console.log(
    `i18n: ${Object.keys(english).length} keys complete in three locales; UI parameters and resource boundaries verified.`,
  )
