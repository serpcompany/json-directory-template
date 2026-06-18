import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { resolveSiteContent } from '@thedaviddias/site-contract'
import { describe, expect, it } from 'vitest'
import { loadCheckedInSite } from './site-config.ts'

type CategoryEntry = {
  description?: string
  name: string
  slug: string
}

type ProductEntry = {
  content?: {
    body?: string
  }
  product?: {
    categories?: string[]
    productPage?: string
    slug?: string
    title?: string
  }
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

describe('serp.co checked-in migration output', () => {
  it('keeps the migrated base product set plus missing canonical downloaders checked in', () => {
    const downloaderProducts = readJson<Record<string, ProductEntry>>(
      resolve(process.cwd(), 'sites/serpdownloaders.com/products.json')
    )
    const actualProducts = readJson<Record<string, ProductEntry>>(
      resolve(process.cwd(), 'sites/serp.co/products.json')
    )
    const knownNonMirroredDownloaderSlugs = [
      'coomervideodownloader.pages.dev',
      'doodstreamvideodownloader.pages.dev',
      'hdzogvideodownloader.pages.dev',
      'hotmovsvideodownloader.pages.dev',
      'javvideodownloader.pages.dev',
      'luxuretvvideodownloader.pages.dev',
      'manyvidsvideodownloader.pages.dev',
      'onlyfansvideodownloader.pages.dev',
      'pornhatvideodownloader.pages.dev',
      'pornhubvideodownloader.pages.dev',
      'pornonevideodownloader.pages.dev',
      'stripchatvideodownloader.pages.dev',
      'txxxvideodownloader.pages.dev',
      'uporniavideodownloader.pages.dev',
      'whopvideodownloader.pages.dev',
      'xfantazyvideodownloader.pages.dev',
      'xfreehdvideodownloader.pages.dev',
      'xgroovyvideodownloader.pages.dev',
      'youpornvideodownloader.pages.dev'
    ]
    const knownNonMirroredDownloaderSlugSet = new Set(knownNonMirroredDownloaderSlugs)
    const canonicalDownloaderSlugs = Object.keys(downloaderProducts).filter(
      slug => !knownNonMirroredDownloaderSlugSet.has(slug)
    )
    const missingDownloaderSlugs = Object.keys(downloaderProducts).filter(
      slug => !actualProducts[slug]
    )

    expect(Object.keys(actualProducts)).toHaveLength(3421)
    expect(missingDownloaderSlugs).toEqual(knownNonMirroredDownloaderSlugs)
    expect(Object.keys(actualProducts).length).toBeGreaterThan(canonicalDownloaderSlugs.length)
    expect(actualProducts['launchbuzz.io']?.product?.title).toBe('LaunchBuzz')
    expect(actualProducts['launchbuzz.io']?.product?.categories).toContain(
      'product-launch-websites'
    )

    for (const slug of canonicalDownloaderSlugs) {
      const expectedProduct = downloaderProducts[slug]

      expect(actualProducts[slug], `serp.co must include ${slug}`).toBeDefined()
      expect(actualProducts[slug]?.product?.title).toBe(expectedProduct?.product?.title)
      for (const category of expectedProduct?.product?.categories ?? []) {
        expect(actualProducts[slug]?.product?.categories).toContain(category)
      }
    }
  })

  it('keeps migrated categories plus the explicit other fallback category', () => {
    const actualCategories = readJson<CategoryEntry[]>(
      resolve(process.cwd(), 'sites/serp.co/categories.json')
    )
    const categorySlugs = actualCategories.map(category => category.slug)

    expect(actualCategories).toHaveLength(140)
    expect(new Set(categorySlugs).size).toBe(categorySlugs.length)
    expect(actualCategories).toContainEqual({
      description: 'Browse product launch website listings and resources.',
      name: 'Product Launch Websites',
      slug: 'product-launch-websites'
    })
    expect(actualCategories).toContainEqual({
      description: 'Browse other software, tools, companies, and resources.',
      name: 'Other',
      slug: 'other'
    })
  })

  it('maps migrated site identity into checked-in site config', () => {
    const config = loadCheckedInSite('serp.co')

    expect(config.site.name).toBe('SERP')
    expect(config.site.publicUrl).toBe('https://serp.co')
    expect(config.site.domain).toBe('serp.co')
    expect(config.site.description).toBe(
      'SERP helps people discover software, AI tools, companies, resources, and projects from the SERP network.'
    )
    expect(config.site.tagline).toBe('Software, AI tools, companies, resources, and SERP projects')
  })

  it('maps migrated social links into site-owned network links', () => {
    const siteContent = resolveSiteContent('serp.co')
    const networkLinksByLabel = new Map(
      siteContent.networkLinks.map(link => [link.label.toLowerCase(), link.href])
    )

    expect(networkLinksByLabel.get('linkedin')).toBe('https://serp.ly/@serp/linkedin')
    expect(networkLinksByLabel.get('youtube')).toBe('https://serp.ly/@serp/youtube')
    expect(networkLinksByLabel.get('facebook')).toBe('https://serp.ly/@serp/facebook')
    expect(networkLinksByLabel.get('instagram')).toBe('https://serp.ly/@serp/instagram')
  })

  it('keeps required migrated public and checked-in brand assets in the serp.co wrapper', () => {
    const requiredPaths = [
      'apps/serp.co/public/favicon.ico',
      'apps/serp.co/public/logo.png',
      'apps/serp.co/public/og.png',
      'apps/serp.co/public/badge/featured-on-serp.co-dark.svg',
      'apps/serp.co/public/badge/featured-on-serp.co-light.svg',
      'sites/serp.co/assets/favicon.ico',
      'sites/serp.co/assets/logo.png',
      'sites/serp.co/assets/opengraph-image.png'
    ]

    for (const relativePath of requiredPaths) {
      expect(existsSync(resolve(process.cwd(), relativePath)), relativePath).toBe(true)
    }
  })

  it('uses serp.ly downloader outbound links instead of apps.serp.co product links', () => {
    const siteProducts = readJson<
      Record<
        string,
        {
          content?: { body?: string }
          product?: { categories?: string[]; productPage?: string; slug?: string }
        }
      >
    >(resolve(process.cwd(), 'sites/serp.co/products.json'))
    const badProductPages: string[] = []
    const badBodyLinks: string[] = []
    const missingSerpLyProductPages: string[] = []

    for (const [key, entry] of Object.entries(siteProducts)) {
      const slug = entry.product?.slug ?? key
      const productPage = entry.product?.productPage ?? ''
      const body = entry.content?.body ?? ''
      const isDownloader = entry.product?.categories?.includes('video-downloaders') ?? false

      if (!isDownloader) {
        continue
      }

      if (productPage.includes('apps.serp.co')) {
        badProductPages.push(`${slug}: ${productPage}`)
      }

      if (!productPage.startsWith('https://serp.ly/')) {
        missingSerpLyProductPages.push(`${slug}: ${productPage}`)
      }

      if (body.includes('https://apps.serp.co/')) {
        badBodyLinks.push(slug)
      }
    }

    expect(badProductPages).toEqual([])
    expect(badBodyLinks).toEqual([])
    expect(missingSerpLyProductPages).toEqual([])
  })
})
