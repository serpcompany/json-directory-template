import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { readD1ListingExportEntries } from './d1-listing-records.ts'
import { readLocalD1ListingEntries } from './local-d1-listings.ts'
import type { CheckedInSiteConfigRecord } from './site-config.ts'
import { writeTrialWebsiteEntries } from './trial-build.ts'

const workspaceRoot = resolve(process.cwd())
const defaultListingOutputPath = 'data/listings.json'

function ensureParentDir(path: string): void {
  mkdirSync(dirname(path), { recursive: true })
}

export type PreparedListingSource = {
  outputPath: string
  outputPathDisplay: string
  siteId: string
  sourceKind: string
  sourcePathDisplay: string
}

export function getListingSourceOutputPath(
  sourcePlan: CheckedInSiteConfigRecord['content']['listingSource']
): string {
  return sourcePlan.outputPath || defaultListingOutputPath
}

export function getListingSourcePathDisplay(
  siteId: string,
  sourcePlan: CheckedInSiteConfigRecord['content']['listingSource']
): string {
  if (sourcePlan.kind === 'd1-listings') {
    if (sourcePlan.mode === 'local-d1') {
      const sourceSiteId = sourcePlan.siteId ?? siteId
      return `${sourcePlan.databaseName}#${sourceSiteId}`
    }

    const sourceSiteId = sourcePlan.siteId ?? siteId
    return `${sourcePlan.exportPath}#${sourceSiteId}`
  }

  return sourcePlan.path
}

export function writeListingSourceToPath(options: {
  definition: CheckedInSiteConfigRecord
  outputPath: string
}): void {
  const sourcePlan = options.definition.content.listingSource

  ensureParentDir(options.outputPath)

  if (sourcePlan.kind === 'trial-products-json') {
    writeTrialWebsiteEntries(sourcePlan.path, options.outputPath, {
      category: sourcePlan.category,
      featuredCount: sourcePlan.featuredCount,
      publishedAt: sourcePlan.publishedAt
    })
    return
  }

  if (sourcePlan.kind === 'd1-listings') {
    const entries =
      sourcePlan.mode === 'local-d1'
        ? readLocalD1ListingEntries({
            approvedOnly: sourcePlan.approvedOnly,
            databaseName: sourcePlan.databaseName,
            siteId: sourcePlan.siteId ?? options.definition.id,
            wranglerConfigPath: sourcePlan.wranglerConfigPath
          })
        : readD1ListingExportEntries({
            approvedOnly: sourcePlan.approvedOnly,
            exportPath: sourcePlan.exportPath ?? missingD1SnapshotExportPath(options.definition.id),
            siteId: sourcePlan.siteId ?? options.definition.id
          })
    writeFileSync(options.outputPath, `${JSON.stringify(entries, null, 2)}\n`)
    return
  }

  const sourcePath = resolve(workspaceRoot, sourcePlan.path)

  if (sourcePath !== options.outputPath) {
    writeFileSync(options.outputPath, readFileSync(sourcePath))
  }
}

function missingD1SnapshotExportPath(siteId: string): never {
  throw new Error(`d1-listings snapshot source for ${siteId} requires exportPath.`)
}

export function prepareListingSource(definition: CheckedInSiteConfigRecord): PreparedListingSource {
  const sourcePlan = definition.content.listingSource
  const outputPathDisplay = getListingSourceOutputPath(sourcePlan)
  const outputPath = resolve(workspaceRoot, outputPathDisplay)

  writeListingSourceToPath({ definition, outputPath })

  return {
    outputPath,
    outputPathDisplay,
    siteId: definition.id,
    sourceKind: sourcePlan.kind,
    sourcePathDisplay: getListingSourcePathDisplay(definition.id, sourcePlan)
  }
}
