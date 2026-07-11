import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  loadCheckedInSiteFromInput,
  parseSiteInputArgs,
  type SiteInputTarget
} from './site-config.ts'

type NormalizeListingLogosToPngOptions = {
  convertImpl?: (inputPath: string, outputPath: string) => void
}

type TrialProductsRecord = Record<string, Record<string, unknown>>

function isRootRelativeLogoPath(logoPath: string, siteId: string): boolean {
  return logoPath.startsWith(`/listing-logos/${siteId}/`)
}

function isPngLogoPath(logoPath: string): boolean {
  return logoPath.toLowerCase().split('?')[0].endsWith('.png')
}

function toPublicAssetAbsolutePath(logoPath: string): string {
  return resolve(process.cwd(), 'apps', 'web', 'public', logoPath.slice(1))
}

function toPngLogoPath(logoPath: string): string {
  return logoPath.replace(/\.[^./?#]+(?=$|[?#])/, '.png')
}

function getSourceExtension(assetPath: string): string {
  const pathname = assetPath.toLowerCase().split('?')[0]
  const match = pathname.match(/(\.[^./]+)$/)

  return match?.[1] ?? ''
}

function defaultConvertImpl(inputPath: string, outputPath: string): void {
  const sourceExtension = getSourceExtension(inputPath)
  const magickInputPath =
    sourceExtension === '.gif' || sourceExtension === '.ico' ? `${inputPath}[0]` : inputPath

  mkdirSync(dirname(outputPath), { recursive: true })

  if (sourceExtension === '.svg') {
    execFileSync('rsvg-convert', ['--format', 'png', '--output', outputPath, inputPath], {
      stdio: 'pipe'
    })
    return
  }

  execFileSync('magick', [magickInputPath, '-background', 'none', '-alpha', 'on', outputPath], {
    stdio: 'pipe'
  })
}

export async function normalizeListingLogosToPng(
  input: SiteInputTarget,
  options: NormalizeListingLogosToPngOptions = {}
): Promise<{
  convertedCount: number
  siteId: string
  sourcePathDisplay: string
}> {
  const convertImpl = options.convertImpl ?? defaultConvertImpl
  const definition = loadCheckedInSiteFromInput(input)

  if (definition.content.listingSource.kind === 'd1-listings') {
    throw new Error(
      `Listing logo normalization currently supports file-backed listing sources. ${definition.id} uses d1-listings.`
    )
  }

  const sourcePath = definition.content.listingSource.path
  const sourceFilePath = resolve(process.cwd(), sourcePath)
  const products = JSON.parse(readFileSync(sourceFilePath, 'utf8')) as TrialProductsRecord

  let convertedCount = 0

  for (const currentProduct of Object.values(products)) {
    const currentMedia =
      typeof currentProduct.media === 'object' && currentProduct.media
        ? (currentProduct.media as Record<string, unknown>)
        : null

    const currentLogo = typeof currentMedia?.logo === 'string' ? currentMedia.logo : ''

    if (
      !currentLogo ||
      !isRootRelativeLogoPath(currentLogo, definition.id) ||
      isPngLogoPath(currentLogo)
    ) {
      continue
    }

    const sourceAssetPath = toPublicAssetAbsolutePath(currentLogo)
    const targetLogoPath = toPngLogoPath(currentLogo)
    const targetAssetPath = toPublicAssetAbsolutePath(targetLogoPath)

    if (!existsSync(sourceAssetPath)) {
      continue
    }

    convertImpl(sourceAssetPath, targetAssetPath)

    currentProduct.media = {
      ...currentMedia,
      logo: targetLogoPath
    }
    convertedCount += 1
  }

  writeFileSync(sourceFilePath, `${JSON.stringify(products, null, 2)}\n`)

  return {
    convertedCount,
    siteId: definition.id,
    sourcePathDisplay: sourcePath
  }
}

async function main(): Promise<void> {
  const result = await normalizeListingLogosToPng(parseSiteInputArgs(process.argv.slice(2)))

  console.log(`Normalized ${result.convertedCount} listing logos to PNG for ${result.siteId}`)
  console.log(`Source: ${result.sourcePathDisplay}`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    const message = error instanceof Error ? error.message : String(error)
    console.error(message)
    process.exitCode = 1
  })
}
