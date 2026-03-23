import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

type TrialProduct = {
  contentMarketing?: {
    productPositioning?: {
      elevatorPitch?: string
      useCases?: string[]
      valueProposition?: string
    }
    storeListingCopy?: {
      shortDescription?: string
    }
  }
  technicalInfo?: {
    coreIdentity?: {
      extensionName?: string
      slug?: string
    }
    storeAndDistribution?: {
      helpCenter?: string
      productPage?: string
    }
  }
}

type TrialProducts = Record<string, TrialProduct>

type TrialBuildOptions = {
  category: string
  featuredCount?: number
  publishedAt: string
}

type WebsiteJsonEntry = {
  category: string
  content?: string
  description: string
  favicon: string
  featured?: boolean
  llmsFullUrl: string
  llmsUrl: string
  name: string
  publishedAt: string
  slug: string
  website: string
}

function buildFaviconUrl(websiteUrl: string): string {
  const domain = new URL(websiteUrl).hostname
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
}

function buildContent(product: TrialProduct, websiteUrl: string): string | undefined {
  const elevatorPitch = product.contentMarketing?.productPositioning?.elevatorPitch?.trim()
  const valueProposition = product.contentMarketing?.productPositioning?.valueProposition?.trim()
  const useCases = product.contentMarketing?.productPositioning?.useCases
    ?.map(useCase => useCase.trim())
    .filter(Boolean)

  const sections = [
    elevatorPitch ? `## Overview\n\n${elevatorPitch}` : '',
    valueProposition ? `## Why It Exists\n\n${valueProposition}` : '',
    useCases && useCases.length > 0
      ? `## Offline use cases\n\n${useCases.map(useCase => `- ${useCase}`).join('\n')}`
      : '',
    `## Links\n\n- Product page: ${websiteUrl}`
  ].filter(Boolean)

  return sections.length > 0 ? sections.join('\n\n') : undefined
}

export function buildTrialWebsiteEntries(
  products: TrialProducts,
  options: TrialBuildOptions
): WebsiteJsonEntry[] {
  return Object.entries(products)
    .map(([fallbackSlug, product], index) => {
      const slug = product.technicalInfo?.coreIdentity?.slug || fallbackSlug
      const websiteUrl = product.technicalInfo?.storeAndDistribution?.productPage

      if (!websiteUrl) {
        throw new Error(`Missing product page for ${slug}`)
      }

      const name = product.technicalInfo?.coreIdentity?.extensionName?.trim()

      if (!name) {
        throw new Error(`Missing extension name for ${slug}`)
      }

      const description =
        product.contentMarketing?.storeListingCopy?.shortDescription?.trim() ||
        product.contentMarketing?.productPositioning?.elevatorPitch?.trim()

      if (!description) {
        throw new Error(`Missing description for ${slug}`)
      }

      const normalizedWebsiteUrl = websiteUrl.replace(/\/$/, '')

      return {
        category: options.category,
        content: buildContent(product, normalizedWebsiteUrl),
        description,
        favicon: buildFaviconUrl(normalizedWebsiteUrl),
        featured: index < (options.featuredCount ?? 6),
        llmsFullUrl: `${normalizedWebsiteUrl}/llms-full.txt`,
        llmsUrl: `${normalizedWebsiteUrl}/llms.txt`,
        name,
        publishedAt: options.publishedAt,
        slug,
        website: normalizedWebsiteUrl
      }
    })
    .sort((entryA, entryB) => entryA.name.localeCompare(entryB.name))
}

export function writeTrialWebsiteEntries(
  inputPath: string,
  outputPath: string,
  options: TrialBuildOptions
): void {
  const products = JSON.parse(readFileSync(resolve(inputPath), 'utf8')) as TrialProducts
  const entries = buildTrialWebsiteEntries(products, options)
  writeFileSync(resolve(outputPath), `${JSON.stringify(entries, null, 2)}\n`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const inputPath = process.argv[2]
  const outputPath = process.argv[3] || 'data/websites.json'

  if (!inputPath) {
    throw new Error('Usage: pnpm tsx scripts/trial-build.ts <input-json> [output-json]')
  }

  writeTrialWebsiteEntries(inputPath, outputPath, {
    category: process.env.TRIAL_WEBSITE_CATEGORY || 'automation-workflow',
    featuredCount: Number(process.env.TRIAL_WEBSITE_FEATURED_COUNT || '6'),
    publishedAt: process.env.TRIAL_WEBSITE_PUBLISHED_AT || new Date().toISOString().slice(0, 10)
  })
}
