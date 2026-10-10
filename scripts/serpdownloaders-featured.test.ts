import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadCheckedInSite } from './site-config.ts'
import { buildTrialWebsiteEntries } from './trial-build.ts'

type TrialProductFixture = {
  featured?: boolean
  product?: {
    slug?: string
  }
}

// Owner-chosen homepage featured listings (#161).
const ownerFeaturedSlugs = [
  'circle-downloader',
  'kajabi-downloader',
  'loom-downloader',
  'onlyfans-downloader',
  'skool-video-downloader',
  'vimeo-downloader',
  'whop-downloader'
]

function readProducts() {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), 'sites/serpdownloaders.com/products.json'), 'utf8')
  ) as Record<string, TrialProductFixture>
}

describe('serpdownloaders.com featured listings', () => {
  it('flags exactly the owner-chosen products as featured in products.json', () => {
    const featured = Object.entries(readProducts())
      .filter(([, product]) => product.featured === true)
      .map(([fallbackSlug, product]) => product.product?.slug ?? fallbackSlug)
      .sort()

    expect(featured).toEqual(ownerFeaturedSlugs)
  })

  it('builds exactly the owner-chosen listings as featured with the site featuredCount', () => {
    const { listingSource } = loadCheckedInSite('serpdownloaders.com').content
    if (listingSource.kind !== 'trial-products-json') {
      throw new Error('expected serpdownloaders.com to build from trial products')
    }

    expect(listingSource.featuredCount).toBe(0)

    const entries = buildTrialWebsiteEntries(readProducts(), {
      category: 'video-downloaders',
      featuredCount: listingSource.featuredCount,
      publishedAt: '2026-03-24'
    })
    const builtFeatured = entries
      .filter(entry => entry.featured === true)
      .map(entry => entry.slug)
      .sort()

    expect(builtFeatured).toEqual(ownerFeaturedSlugs)
  })
})
