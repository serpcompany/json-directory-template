import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildTrialWebsiteEntries } from './trial-build.ts'

type TrialProductFixture = {
  featured?: boolean
  product?: {
    categories?: string[]
    slug?: string
  }
}

const siteIds = ['serp.co', 'browserextensions.io', 'serp.ai'] as const

function readProducts(siteId: (typeof siteIds)[number]) {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), `sites/${siteId}/products.json`), 'utf8')
  ) as Record<string, TrialProductFixture>
}

function productSlug(fallbackSlug: string, product: TrialProductFixture): string {
  return product.product?.slug ?? fallbackSlug
}

function isVideoDownloader(product: TrialProductFixture): boolean {
  return product.product?.categories?.includes('video-downloaders') ?? false
}

function isAdultDownloader(product: TrialProductFixture): boolean {
  return product.product?.categories?.includes('adult') ?? false
}

describe('video downloader featured listings', () => {
  for (const siteId of siteIds) {
    it(`marks every ${siteId} video downloader source product as featured`, () => {
      const products = readProducts(siteId)
      const videoDownloaders = Object.entries(products).filter(([, product]) =>
        isVideoDownloader(product)
      )
      const unfeaturedVideoDownloaders = videoDownloaders
        .filter(([, product]) => product.featured !== true)
        .map(([fallbackSlug, product]) => productSlug(fallbackSlug, product))
      const wronglyFeaturedNonVideoProducts = Object.entries(products)
        .filter(([, product]) => !isVideoDownloader(product) && product.featured === true)
        .map(([fallbackSlug, product]) => productSlug(fallbackSlug, product))

      expect(videoDownloaders.length).toBeGreaterThan(0)
      expect(unfeaturedVideoDownloaders).toEqual([])
      expect(wronglyFeaturedNonVideoProducts).toEqual([])
    })

    it(`carries ${siteId} video downloader source featured flags into built listings`, () => {
      const products = readProducts(siteId)
      const entries = buildTrialWebsiteEntries(products, {
        category: 'other',
        featuredCount: 0,
        publishedAt: '2026-05-16'
      })
      const sourceVideoSlugs = Object.entries(products)
        .filter(([, product]) => isVideoDownloader(product))
        .map(([fallbackSlug, product]) => productSlug(fallbackSlug, product))
        .sort()
      const builtFeaturedSlugs = entries
        .filter(entry => entry.featured === true)
        .map(entry => entry.slug)
        .sort()

      expect(builtFeaturedSlugs).toEqual(sourceVideoSlugs)
    })
  }

  it('keeps every serp.ai adult downloader source product in Video Downloaders', () => {
    const products = readProducts('serp.ai')
    const adultDownloaders = Object.entries(products).filter(([, product]) =>
      isAdultDownloader(product)
    )
    const adultDownloadersMissingVideo = adultDownloaders
      .filter(([, product]) => !isVideoDownloader(product))
      .map(([fallbackSlug, product]) => productSlug(fallbackSlug, product))

    expect(adultDownloaders).toHaveLength(262)
    expect(adultDownloadersMissingVideo).toEqual([])
  })

  it('does not feed featured category pages from the homepage-capped featured list', () => {
    const featuredRoutePaths = [
      'apps/browserextensions.io/app/categories/featured/page.tsx',
      'apps/serp.ai/app/categories/featured/page.tsx',
      'apps/serp.co/app/categories/featured/page.tsx'
    ]

    for (const routePath of featuredRoutePaths) {
      const source = readFileSync(resolve(process.cwd(), routePath), 'utf8')

      expect(source).toContain('const { allProjects } = await getHomePageData()')
      expect(source).toContain('allProjects.filter')
      expect(source).not.toContain('const { allProjects, featuredProjects }')
    }
  })
})
