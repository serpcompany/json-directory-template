import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  type NormalizedTrialProduct,
  normalizeTrialProduct,
  type TrialProducts
} from '@thedaviddias/site-contract/trial-products'
import { getListingSpecificResourceLinks } from '@thedaviddias/web-core/resource-links'

export type { TrialProducts } from '@thedaviddias/site-contract/trial-products'
export { canonicalizeTrialProducts } from '@thedaviddias/site-contract/trial-products'

type TrialBuildOptions = {
  category: string
  featuredCount?: number
  publishedAt: string
}

type WebsiteJsonEntry = {
  categories?: string[]
  content?: string
  description: string
  featured?: boolean
  media?: {
    images?: string[]
    logo?: string
    video?: string
  }
  name: string
  publishedAt: string
  resourceLinks?: Array<{
    label: string
    url: string
  }>
  slug: string
  website: string
}

function cleanString(value?: string): string | undefined {
  const trimmedValue = value?.trim()
  return trimmedValue ? trimmedValue : undefined
}

function escapeMdxText(value: string): string {
  return value.replaceAll('{', '\\{').replaceAll('}', '\\}')
}

function buildContent(product: NormalizedTrialProduct): string | undefined {
  const body = cleanString(product.content?.body)
  const faq = product.content?.faq

  const sections = [
    body || '',
    faq && faq.length > 0
      ? `## FAQ\n\n${faq
          .map(
            faqEntry =>
              `### ${escapeMdxText(faqEntry.question)}\n\n${escapeMdxText(faqEntry.answer)}`
          )
          .join('\n\n')}`
      : ''
  ].filter(Boolean)

  return sections.length > 0 ? sections.join('\n\n') : undefined
}

function buildResourceLinks(product: NormalizedTrialProduct): WebsiteJsonEntry['resourceLinks'] {
  const listingSpecificLinks = getListingSpecificResourceLinks(product.resourceLinks)

  return listingSpecificLinks && listingSpecificLinks.length > 0 ? listingSpecificLinks : undefined
}

export function buildTrialWebsiteEntries(
  products: TrialProducts,
  options: TrialBuildOptions
): WebsiteJsonEntry[] {
  return Object.entries(products)
    .map(([fallbackSlug, product], index) => {
      const normalizedProduct = normalizeTrialProduct(product, fallbackSlug, options.category)
      const normalizedWebsiteUrl = normalizedProduct.website.replace(/\/$/, '')
      const resourceLinks = buildResourceLinks(normalizedProduct)

      return {
        categories: normalizedProduct.categories,
        content: buildContent(normalizedProduct),
        description: normalizedProduct.description,
        featured: normalizedProduct.featured ?? index < (options.featuredCount ?? 6),
        name: normalizedProduct.name,
        publishedAt: options.publishedAt,
        slug: normalizedProduct.slug,
        website: normalizedWebsiteUrl,
        ...(normalizedProduct.media ? { media: normalizedProduct.media } : {}),
        ...(resourceLinks ? { resourceLinks } : {})
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
  const outputPath = process.argv[3] || 'data/listings.json'

  if (!inputPath) {
    throw new Error('Usage: pnpm tsx scripts/trial-build.ts <input-json> [output-json]')
  }

  writeTrialWebsiteEntries(inputPath, outputPath, {
    category: process.env.TRIAL_WEBSITE_CATEGORY || 'automation-workflow',
    featuredCount: Number(process.env.TRIAL_WEBSITE_FEATURED_COUNT || '6'),
    publishedAt: process.env.TRIAL_WEBSITE_PUBLISHED_AT || new Date().toISOString().slice(0, 10)
  })
}
