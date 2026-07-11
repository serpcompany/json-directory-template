import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { websiteJsonEntriesSchema } from '@thedaviddias/web-core/website-schema'
import { type D1ListingExportFile, websiteJsonEntryToD1Record } from './d1-listing-records.ts'
import { writeListingSourceToPath } from './listing-source-adapters.ts'
import { createRunTempDir } from './run-context.ts'
import {
  loadCheckedInSiteFromInput,
  parseSiteInputArgs,
  type SiteInputTarget
} from './site-config.ts'

type SnapshotOptions = SiteInputTarget & {
  outputPath?: string
}

function parseSnapshotArgs(argv: string[]): SnapshotOptions {
  const siteInput = parseSiteInputArgs(argv)
  const outputFlagIndex = argv.indexOf('--output')

  return {
    ...siteInput,
    outputPath: outputFlagIndex >= 0 ? argv[outputFlagIndex + 1] : undefined
  }
}

function checksumJson(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

export function createD1ListingsSnapshot(options: SnapshotOptions): D1ListingExportFile {
  const definition = loadCheckedInSiteFromInput(options)
  const runTempDir = createRunTempDir('d1-listings-snapshot', definition.id)
  const snapshotInputPath = resolve(runTempDir.path, 'listings.json')
  const now = new Date().toISOString()

  try {
    writeListingSourceToPath({
      definition,
      outputPath: snapshotInputPath
    })

    const parsed = JSON.parse(readFileSync(snapshotInputPath, 'utf8')) as unknown
    const result = websiteJsonEntriesSchema.safeParse(parsed)

    if (!result.success) {
      const details = result.error.issues
        .map(issue => {
          const path = issue.path.length > 0 ? issue.path.join('.') : 'root'
          return `[${path}] ${issue.message}`
        })
        .join('\n')

      throw new Error(`Cannot create D1 listings snapshot for ${definition.id}\n${details}`)
    }

    const records = result.data.map(entry =>
      websiteJsonEntryToD1Record(entry, {
        now,
        siteId: definition.id,
        status: 'approved'
      })
    )

    const snapshot: D1ListingExportFile = {
      exportedAt: now,
      rows: records,
      source: 'd1-public-listings',
      version: 1
    }

    if (options.outputPath) {
      const outputPath = resolve(options.outputPath)
      mkdirSync(dirname(outputPath), { recursive: true })
      writeFileSync(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`)
    }

    console.log(`D1 listings snapshot for ${definition.id}: ${records.length} approved rows`)
    console.log(`Checksum: ${checksumJson(snapshot.rows)}`)

    if (options.outputPath) {
      console.log(`Output: ${options.outputPath}`)
    } else {
      console.log('Dry run only. Pass --output <path> to write a snapshot file.')
    }

    return snapshot
  } finally {
    runTempDir.cleanup()
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    createD1ListingsSnapshot(parseSnapshotArgs(process.argv.slice(2)))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(message)
    process.exitCode = 1
  }
}
