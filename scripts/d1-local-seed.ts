import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  type WebsiteJsonEntry,
  websiteJsonEntriesSchema
} from '@thedaviddias/web-core/website-schema'
import { type D1ListingRecord, websiteJsonEntryToD1Record } from './d1-listing-records.ts'
import { createRunTempDir } from './run-context.ts'
import {
  type CheckedInSiteConfigRecord,
  loadCheckedInSiteFromInput,
  parseSiteInputArgs,
  type SiteInputTarget
} from './site-config.ts'
import { buildTrialWebsiteEntries } from './trial-build.ts'

type TrialProductsSeedSource = {
  category: string
  featuredCount: number
  kind: 'trial-products-json'
  path: string
  publishedAt: string
}

function escapeSqlString(value: string): string {
  return value.replaceAll("'", "''")
}

function toSqlValue(value: null | number | string): string {
  if (value === null) {
    return 'NULL'
  }

  if (typeof value === 'number') {
    return String(value)
  }

  return `'${escapeSqlString(value)}'`
}

function getTrialProductsEntries(seedSource: TrialProductsSeedSource): WebsiteJsonEntry[] {
  const products = JSON.parse(readFileSync(resolve(seedSource.path), 'utf8')) as Parameters<
    typeof buildTrialWebsiteEntries
  >[0]

  return buildTrialWebsiteEntries(products, {
    category: seedSource.category,
    featuredCount: seedSource.featuredCount,
    publishedAt: seedSource.publishedAt
  })
}

function getSeedEntries(definition: CheckedInSiteConfigRecord): WebsiteJsonEntry[] {
  const source = definition.content.listingSource

  if (source.kind === 'trial-products-json') {
    return getTrialProductsEntries(source)
  }

  if (source.kind === 'listing-json') {
    const parsed = JSON.parse(readFileSync(resolve(source.path), 'utf8')) as unknown
    return websiteJsonEntriesSchema.parse(parsed)
  }

  if (source.kind === 'd1-listings' && source.seedSource?.kind === 'trial-products-json') {
    return getTrialProductsEntries(source.seedSource)
  }

  throw new Error(`No local D1 seed source configured for ${definition.id}.`)
}

function recordToInsertStatement(record: D1ListingRecord): string {
  const columns = [
    'site_id',
    'slug',
    'name',
    'description',
    'website',
    'category',
    'categories_json',
    'published_at',
    'featured',
    'is_unofficial',
    'priority',
    'entity_type',
    'media_json',
    'resource_links_json',
    'content',
    'status',
    'source_updated_at',
    'created_at',
    'updated_at'
  ]
  const values = [
    record.siteId,
    record.slug,
    record.name,
    record.description,
    record.website,
    record.category,
    record.categoriesJson,
    record.publishedAt,
    record.featured,
    record.isUnofficial,
    record.priority,
    record.entityType,
    record.mediaJson,
    record.resourceLinksJson,
    record.content,
    record.status,
    record.sourceUpdatedAt,
    record.createdAt,
    record.updatedAt
  ].map(toSqlValue)

  return `INSERT OR REPLACE INTO public_listings (${columns.join(', ')}) VALUES (${values.join(', ')});`
}

export function seedLocalD1Listings(input: SiteInputTarget): void {
  const definition = loadCheckedInSiteFromInput(input)
  const source = definition.content.listingSource
  const databaseName = source.kind === 'd1-listings' ? source.databaseName : 'json-directory-local'
  const wranglerConfigPath =
    source.kind === 'd1-listings' ? source.wranglerConfigPath : 'wrangler.jsonc'

  if (!databaseName) {
    throw new Error(`No local D1 database name configured for ${definition.id}.`)
  }

  const now = new Date().toISOString()
  const records = getSeedEntries(definition).map(entry =>
    websiteJsonEntryToD1Record(entry, {
      now,
      siteId: definition.id,
      status: 'approved'
    })
  )
  const runTempDir = createRunTempDir('d1-local-seed', definition.id)
  const sqlPath = resolve(runTempDir.path, 'seed.sql')

  try {
    mkdirSync(dirname(sqlPath), { recursive: true })
    writeFileSync(
      sqlPath,
      [
        'BEGIN TRANSACTION;',
        `DELETE FROM public_listings WHERE site_id = '${escapeSqlString(definition.id)}';`,
        ...records.map(recordToInsertStatement),
        'COMMIT;'
      ].join('\n')
    )

    execFileSync(
      'pnpm',
      [
        'dlx',
        'wrangler@latest',
        'd1',
        'execute',
        databaseName,
        '--local',
        '--persist-to',
        '.wrangler/state',
        '--config',
        wranglerConfigPath,
        '--file',
        sqlPath,
        '--yes'
      ],
      {
        encoding: 'utf8',
        env: {
          ...process.env,
          WRANGLER_SEND_METRICS: 'false'
        },
        stdio: 'inherit'
      }
    )

    console.log(
      `Seeded local D1 database ${databaseName} for ${definition.id}: ${records.length} rows`
    )
  } finally {
    runTempDir.cleanup()
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    seedLocalD1Listings(parseSiteInputArgs(process.argv.slice(2)))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(message)
    process.exitCode = 1
  }
}
