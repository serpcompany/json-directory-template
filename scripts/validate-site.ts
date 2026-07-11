import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  getActiveCategories,
  getUnknownCategorySlugs
} from '@thedaviddias/web-core/category-navigation'
import {
  normalizeJsonWebsite,
  websiteJsonEntriesSchema
} from '@thedaviddias/web-core/website-schema'
import { getListingSourcePathDisplay, writeListingSourceToPath } from './listing-source-adapters.ts'
import { createRunTempDir } from './run-context.ts'
import {
  loadCheckedInSiteFromInput,
  parseSiteInputArgs,
  type SiteInputTarget
} from './site-config.ts'

function getCategoryFixHint(
  siteId: string,
  listingSource: ReturnType<typeof loadCheckedInSiteFromInput>['content']['listingSource']
): string {
  if (listingSource.kind === 'trial-products-json') {
    const configPath =
      siteId === 'default' ? 'sites/site-config.default.ts' : `sites/${siteId}/site-config.ts`

    return `Update content.listingSource.category in ${configPath} or add the slug to sites/${siteId}/categories.json.`
  }

  if (listingSource.kind === 'd1-listings') {
    return `Update approved D1 listings for ${listingSource.siteId ?? siteId} or add the slug to sites/${siteId}/categories.json.`
  }

  return `Update the category values in ${getListingSourcePathDisplay(siteId, listingSource)} or add the slug to sites/${siteId}/categories.json.`
}

export function validateSite(input: SiteInputTarget): void {
  const definition = loadCheckedInSiteFromInput(input)
  const runTempDir = createRunTempDir('validate-site', definition.id)
  const validateDir = runTempDir.path
  const validatePath = resolve(validateDir, 'listings.json')

  try {
    writeListingSourceToPath({ definition, outputPath: validatePath })

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

    const normalizedListings = result.data.map(normalizeJsonWebsite)
    const unknownCategorySlugs = getUnknownCategorySlugs(normalizedListings, definition.id)

    if (unknownCategorySlugs.length > 0) {
      throw new Error(
        [
          `Validation failed for site ${definition.id}`,
          `Unknown category slugs: ${unknownCategorySlugs.join(', ')}`,
          getCategoryFixHint(definition.id, definition.content.listingSource)
        ].join('\n')
      )
    }

    const activeCategories = getActiveCategories(normalizedListings, definition.id)
    console.log(
      `Active categories for ${definition.id}: ${activeCategories
        .map(category => category.slug)
        .join(', ')}`
    )
  } finally {
    runTempDir.cleanup()
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    validateSite(parseSiteInputArgs(process.argv.slice(2)))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(message)
    process.exitCode = 1
  }
}
