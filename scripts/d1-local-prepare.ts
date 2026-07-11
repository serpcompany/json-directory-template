import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { activeCheckedInSiteIds } from '@thedaviddias/site-contract/active-site-ids'
import { seedLocalD1Listings } from './d1-local-seed.ts'
import { loadCheckedInSiteFromInput } from './site-config.ts'

interface LocalD1Target {
  databaseName: string
  siteId: string
  wranglerConfigPath: string
}

function runLocalD1Migrations(target: LocalD1Target): void {
  execFileSync(
    'pnpm',
    [
      'dlx',
      'wrangler@latest',
      'd1',
      'migrations',
      'apply',
      target.databaseName,
      '--local',
      '--persist-to',
      '.wrangler/state',
      '--config',
      target.wranglerConfigPath
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
}

function getLocalD1Targets(siteIds: string[]): LocalD1Target[] {
  return siteIds.flatMap(siteId => {
    const definition = loadCheckedInSiteFromInput({ siteId })
    const source = definition.content.listingSource

    if (source.kind !== 'd1-listings' || source.mode !== 'local-d1') {
      return []
    }

    return [
      {
        databaseName: source.databaseName,
        siteId: definition.id,
        wranglerConfigPath: source.wranglerConfigPath
      }
    ]
  })
}

function getSiteIds(args: string[]): string[] {
  const siteFlagIndex = args.indexOf('--site')

  if (siteFlagIndex >= 0) {
    const siteId = args[siteFlagIndex + 1]

    if (!siteId) {
      throw new Error('Missing site id after --site.')
    }

    return [siteId]
  }

  return [...activeCheckedInSiteIds]
}

export function prepareLocalD1Listings(args: string[] = []): void {
  const migratedTargets = new Set<string>()

  for (const target of getLocalD1Targets(getSiteIds(args))) {
    const migrationKey = `${target.wranglerConfigPath}:${target.databaseName}`

    if (!migratedTargets.has(migrationKey)) {
      runLocalD1Migrations(target)
      migratedTargets.add(migrationKey)
    }

    seedLocalD1Listings({ siteId: target.siteId })
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    prepareLocalD1Listings(process.argv.slice(2))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(message)
    process.exitCode = 1
  }
}
