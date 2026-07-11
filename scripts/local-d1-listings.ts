import { execFileSync } from 'node:child_process'
import type { D1ListingRecord } from './d1-listing-records.ts'
import { d1RecordToWebsiteJsonEntry } from './d1-listing-records.ts'

type WranglerD1Result = {
  results?: unknown[]
  success?: boolean
}

function parseWranglerJsonOutput(output: string): WranglerD1Result[] {
  const trimmedOutput = output.trim()
  const jsonStartIndex = Math.min(
    ...[trimmedOutput.indexOf('['), trimmedOutput.indexOf('{')].filter(index => index >= 0)
  )

  if (!Number.isFinite(jsonStartIndex)) {
    throw new Error(`Wrangler did not return JSON output:\n${output}`)
  }

  const parsed = JSON.parse(trimmedOutput.slice(jsonStartIndex)) as WranglerD1Result | WranglerD1Result[]
  return Array.isArray(parsed) ? parsed : [parsed]
}

function escapeSqlString(value: string): string {
  return value.replaceAll("'", "''")
}

export function runLocalD1Command(options: {
  command: string
  databaseName: string
  wranglerConfigPath?: string
}): WranglerD1Result[] {
  const output = execFileSync(
    'pnpm',
    [
      'dlx',
      'wrangler@latest',
      'd1',
      'execute',
      options.databaseName,
      '--local',
      '--persist-to',
      '.wrangler/state',
      '--config',
      options.wranglerConfigPath ?? 'wrangler.jsonc',
      '--json',
      '--command',
      options.command
    ],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        WRANGLER_SEND_METRICS: 'false'
      },
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe']
    }
  )

  return parseWranglerJsonOutput(output)
}

export function readLocalD1ListingEntries(options: {
  approvedOnly?: boolean
  databaseName: string
  siteId: string
  wranglerConfigPath?: string
}) {
  const statusFilter = (options.approvedOnly ?? true) ? "AND status = 'approved'" : ''
  const query = `
    SELECT
      site_id as siteId,
      slug,
      name,
      description,
      website,
      category,
      categories_json as categoriesJson,
      published_at as publishedAt,
      featured,
      is_unofficial as isUnofficial,
      priority,
      entity_type as entityType,
      media_json as mediaJson,
      resource_links_json as resourceLinksJson,
      content,
      status,
      source_updated_at as sourceUpdatedAt,
      created_at as createdAt,
      updated_at as updatedAt
    FROM public_listings
    WHERE site_id = '${escapeSqlString(options.siteId)}'
      ${statusFilter}
    ORDER BY published_at DESC, name ASC;
  `
  const [result] = runLocalD1Command({
    command: query,
    databaseName: options.databaseName,
    wranglerConfigPath: options.wranglerConfigPath
  })

  if (!result?.success) {
    throw new Error(`Failed to query local D1 database ${options.databaseName}.`)
  }

  return (result.results ?? []).map(row => d1RecordToWebsiteJsonEntry(row as D1ListingRecord))
}
