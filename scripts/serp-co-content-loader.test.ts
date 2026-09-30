import { getListingCategories } from '@thedaviddias/web-core/category-navigation'
import type { WebsiteMetadata } from '@thedaviddias/web-core/content-query'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

type ContentLoader = typeof import('../apps/serp.co/lib/content-loader.ts')

let contentLoader: ContentLoader

function computeLegacyRelatedOrder(
  websites: WebsiteMetadata[],
  website: WebsiteMetadata
): string[] {
  const websiteCategorySlugs = new Set(getListingCategories(website))

  return websites
    .map(site => ({
      sharedCategoryCount: getListingCategories(site).filter(category =>
        websiteCategorySlugs.has(category)
      ).length,
      site
    }))
    .filter(
      ({ sharedCategoryCount, site }) => site.slug !== website.slug && sharedCategoryCount > 0
    )
    .sort((left, right) => {
      if (right.sharedCategoryCount !== left.sharedCategoryCount) {
        return right.sharedCategoryCount - left.sharedCategoryCount
      }

      return left.site.name.localeCompare(right.site.name)
    })
    .map(({ site }) => site.slug)
    .slice(0, 4)
}

describe('serp.co content loader listing cache', () => {
  beforeAll(async () => {
    contentLoader = await import('../apps/serp.co/lib/content-loader.ts')
  })

  it('returns a fresh website array so callers cannot reorder the cached list', () => {
    const websites = contentLoader.getWebsites()
    const firstSlug = websites[0]?.slug

    websites.reverse()

    expect(contentLoader.getWebsites()[0]?.slug).toBe(firstSlug)
    expect(contentLoader.getWebsites()).not.toBe(websites)
  })

  it('resolves known detail pages with sorted-array previous and next ordering', async () => {
    const websites = contentLoader.getWebsites()
    const targetIndex = websites.findIndex(website => website.slug === 'youtube-downloader')

    expect(targetIndex).toBeGreaterThanOrEqual(0)

    const website = websites[targetIndex]
    const detail = await contentLoader.getWebsiteBySlug(website.slug)

    expect(detail?.slug).toBe(website.slug)
    expect(detail?.content).toBe(website.content || '')
    expect(detail?.previousWebsite?.slug ?? null).toBe(websites[targetIndex - 1]?.slug ?? null)
    expect(detail?.nextWebsite?.slug ?? null).toBe(websites[targetIndex + 1]?.slug ?? null)
  })

  it('preserves the existing related listing order for known detail pages', async () => {
    const websites = contentLoader.getWebsites()
    const website = websites.find(currentWebsite => currentWebsite.slug === 'youtube-downloader')

    expect(website).toBeDefined()

    const detail = await contentLoader.getWebsiteBySlug(website!.slug)

    expect(detail?.relatedWebsites.map(related => related.slug)).toEqual(
      computeLegacyRelatedOrder(websites, website!)
    )
  })
})

describe('serp.co legal contact emails', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('keeps legal contact addresses on serp.co while the site origin is best.serp.co', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_ID', 'serp.co')
    vi.stubEnv('SITE_ID', 'serp.co')
    vi.resetModules()

    const { siteConfig } = await import('@thedaviddias/web-core/site-config')
    const serpCoContentLoader = await import('../apps/serp.co/lib/content-loader.ts')

    expect(siteConfig.domain).toBe('best.serp.co')
    expect(siteConfig.legalContactEmailDomain).toBe('serp.co')

    const dmca = await serpCoContentLoader.getLegalContent('dmca')
    const privacy = await serpCoContentLoader.getLegalContent('privacy')
    const terms = await serpCoContentLoader.getLegalContent('terms')

    expect(dmca).toContain('dmca[@]serp.co')
    expect(privacy).toContain('privacy[@]serp.co')
    expect(terms).toContain('privacy[@]serp.co')

    for (const content of [dmca, privacy, terms]) {
      expect(content).not.toContain('best.serp.co')
      expect(content).not.toContain('{{domain}}')
    }
  })

  it('keeps every other active site on its own domain for legal contact addresses', async () => {
    const { resolveSiteConfig } = await import('@thedaviddias/web-core/site-config')

    for (const siteId of ['default', 'browserextensions.io', 'serp.ai', 'serpdownloaders.com']) {
      const config = resolveSiteConfig(siteId)

      expect(config.legalContactEmailDomain, siteId).toBe(config.domain)
    }
  })
})
