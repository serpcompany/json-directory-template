import { readFileSync, writeFileSync } from 'node:fs'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  loadSiteDefinitionFromInput,
  loadBuildSpecFromInput,
  parseBuildInputArgs,
  type BuildInputTarget
} from './build-spec.ts'
import { createRunTempDir } from './run-context.ts'
import { writeTrialWebsiteEntries } from './trial-build.ts'
import { websiteJsonEntriesSchema } from '../apps/web/lib/website-schema.ts'

const workspaceRoot = resolve(process.cwd())

export function validateSite(input: BuildInputTarget): void {
  loadBuildSpecFromInput(input)
  const definition = loadSiteDefinitionFromInput(input)
  const runTempDir = createRunTempDir('validate-site', definition.id)
  const validateDir = runTempDir.path
  const validatePath = resolve(validateDir, 'websites.json')

  try {
    mkdirSync(dirname(validatePath), { recursive: true })

    if (definition.source.kind === 'trial-products-json') {
      writeTrialWebsiteEntries(definition.source.path, validatePath, {
        category: definition.source.category,
        featuredCount: definition.source.featuredCount,
        publishedAt: definition.source.publishedAt
      })
    } else {
      writeFileSync(validatePath, readFileSync(resolve(workspaceRoot, definition.source.path)))
    }

    const parsed = JSON.parse(readFileSync(validatePath, 'utf8')) as unknown
    const result = websiteJsonEntriesSchema.safeParse(parsed)

    if (!result.success) {
      const details = result.error.issues
        .map(issue => {
          const path = issue.path.length > 0 ? issue.path.join('.') : 'root'
          return `[${path}] ${issue.message}`
        })
        .join('\n')

      throw new Error(`Validation failed for site ${definition.id}\n${details}`)
    }

    console.log(`Valid site data for ${definition.id} — ${result.data.length} entries`)
  } finally {
    runTempDir.cleanup()
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  validateSite(parseBuildInputArgs(process.argv.slice(2)))
}
