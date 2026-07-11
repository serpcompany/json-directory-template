import { prepareListingSource } from './listing-source-adapters.ts'
import { warnIfUnsupportedNodeVersion } from './runtime-guards.ts'
import {
  loadCheckedInSiteFromInput,
  parseSiteInputArgs,
  type SiteInputTarget
} from './site-config.ts'

export type PreparedSiteData = {
  outputPath: string
  outputPathDisplay: string
  siteId: string
  sourceKind: string
  sourcePathDisplay: string
}

export function prepareSiteData(input: SiteInputTarget): PreparedSiteData {
  const definition = loadCheckedInSiteFromInput(input)
  return prepareListingSource(definition)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    warnIfUnsupportedNodeVersion()
    const prepared = prepareSiteData(parseSiteInputArgs(process.argv.slice(2)))
    console.log(`Prepared listing data for ${prepared.siteId}`)
    console.log(`Source: ${prepared.sourcePathDisplay} (${prepared.sourceKind})`)
    console.log(`Output: ${prepared.outputPathDisplay}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(message)
    process.exitCode = 1
  }
}
