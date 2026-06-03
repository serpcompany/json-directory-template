import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { resolveSiteContent } from '../packages/site-contract/src/site-content.ts'
import { loadCheckedInSite } from './site-config.ts'

const nextyExportRoot = '/Users/devin/dev/repos/nexty-monorepo/tmp/serp-ai'
const siteRoot = resolve(process.cwd(), 'sites/serp.ai')
const appPublicRoot = resolve(process.cwd(), 'apps/serp.ai/public')

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function sha256(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

describe.runIf(existsSync(nextyExportRoot))('serp.ai nexty export parity', () => {
  it('keeps product and category slugs from the nexty export', () => {
    const nextyProducts = readJson<Record<string, unknown>>(
      resolve(nextyExportRoot, 'products.json')
    )
    const siteProducts = readJson<Record<string, unknown>>(resolve(siteRoot, 'products.json'))
    const nextyCategories = readJson<Array<{ slug: string }>>(
      resolve(nextyExportRoot, 'categories.json')
    )
    const siteCategories = readJson<Array<{ slug: string }>>(resolve(siteRoot, 'categories.json'))

    expect(Object.keys(siteProducts).sort()).toEqual(Object.keys(nextyProducts).sort())
    expect(siteCategories.map(category => category.slug).sort()).toEqual(
      nextyCategories.map(category => category.slug).sort()
    )
  })

  it('uses checked-in config values from the nexty export identity', () => {
    const config = loadCheckedInSite('serp.ai')
    const bundle = readJson<{
      siteConfig: {
        canonicalUrl: string
        description: string
        name: string
        tagLine: string
      }
    }>(resolve(nextyExportRoot, 'site-config-bundle.json'))

    expect(config.site).toMatchObject({
      description: bundle.siteConfig.description,
      name: bundle.siteConfig.name,
      publicUrl: bundle.siteConfig.canonicalUrl,
      tagline: bundle.siteConfig.tagLine
    })
  })

  it('copies exported public assets into the wrapper public directory', () => {
    const assetManifest = readJson<Array<{ exportPath: string; sha256: string }>>(
      resolve(nextyExportRoot, 'asset-manifest.json')
    )

    for (const asset of assetManifest) {
      const relativePath = asset.exportPath.replace(/^public\//, '')
      const targetPath = resolve(appPublicRoot, relativePath)

      expect(existsSync(targetPath), `${relativePath} must exist`).toBe(true)
      expect(sha256(targetPath), `${relativePath} checksum`).toBe(asset.sha256)
    }
  })

  it('keeps exported social profile links available in site content', () => {
    const content = resolveSiteContent('serp.ai')
    const hrefs = content.networkLinks.map(link => link.href)

    expect(hrefs).toContain('https://www.linkedin.com/company/serpdotai')
    expect(hrefs).toContain('https://www.youtube.com/@serpdotai')
    expect(hrefs).toContain('https://facebook.com/serpdotai')
  })

  it('uses serp.ly product outbound links instead of apps.serp.co product links', () => {
    const siteProducts = readJson<
      Record<
        string,
        {
          content?: { body?: string }
          product?: { productPage?: string; slug?: string }
        }
      >
    >(resolve(siteRoot, 'products.json'))
    const badProductPages: string[] = []
    const badBodyLinks: string[] = []
    const missingSerpLyProductPages: string[] = []

    for (const [key, entry] of Object.entries(siteProducts)) {
      const slug = entry.product?.slug ?? key
      const productPage = entry.product?.productPage ?? ''
      const body = entry.content?.body ?? ''

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

describe('serp.ai checked-in downloader products', () => {
  it('includes Patreon and Soundgasm with target review links', () => {
    const siteProducts = readJson<
      Record<
        string,
        {
          featured?: boolean
          product?: {
            categories?: string[]
            productPage?: string
            slug?: string
            title?: string
          }
          relatedLinks?: Array<{ label?: string; url?: string }>
        }
      >
    >(resolve(siteRoot, 'products.json'))

    for (const slug of ['patreon-downloader', 'soundgasm-downloader'] as const) {
      expect(siteProducts[slug], slug).toBeDefined()
      expect(siteProducts[slug]).toMatchObject({
        featured: true,
        product: {
          categories: ['video-downloaders'],
          productPage: `https://serp.ly/${slug}`,
          slug
        },
        relatedLinks: [
          {
            label: 'Install browser extension',
            url: `https://serp.ly/${slug}`
          },
          {
            label: 'SERP Apps',
            url: `https://apps.serp.co/${slug}`
          },
          {
            label: 'GitHub repository',
            url: `https://github.com/serpapps/${slug}`
          },
          {
            label: 'SERP',
            url: `https://serp.co/products/${slug}/reviews/`
          },
          {
            label: 'SERP AI',
            url: `https://serp.ai/products/${slug}/reviews/`
          },
          {
            label: 'Browser Extensions',
            url: `https://browserextensions.io/products/${slug}/`
          }
        ]
      })
    }

    expect(siteProducts['patreon-downloader']?.product?.title).toBe('Patreon Video Downloader')
    expect(siteProducts['soundgasm-downloader']?.product?.title).toBe('Soundgasm Downloader')
  })

  it('keeps the 291-record catalog on product-specific CTAs with clean source links', () => {
    const siteProducts = readJson<
      Record<
        string,
        {
          content?: {
            body?: string
            faq?: Array<{ answer?: string; question?: string }>
          }
          product?: { productPage?: string; slug?: string }
          relatedLinks?: Array<{ label?: string; url?: string }>
        }
      >
    >(resolve(siteRoot, 'products.json'))

    expect(Object.keys(siteProducts)).toHaveLength(291)

    for (const [key, entry] of Object.entries(siteProducts)) {
      const slug = entry.product?.slug ?? key
      const body = entry.content?.body ?? ''

      expect(entry.product?.productPage, slug).toMatch(/^https:\/\/serp\.ly\/.+/)
      expect(body, slug).not.toContain('https://apps.serp.co/')

      if (entry.relatedLinks?.some(link => link.label === 'SERP Apps')) {
        expect(entry.content?.faq?.length, slug).toBeGreaterThanOrEqual(3)
      }

      for (const link of entry.relatedLinks ?? []) {
        expect(link.label, `${slug} link label`).not.toMatch(/^https?:\/\//)
        expect(link.url, `${slug} link url`).not.toBe('https://github.com/serpapps')
        expect(link.url, `${slug} link url`).not.toBe('https://github.com/serpapps/le')
        expect(link.url, `${slug} link url`).not.toContain('apps.serp.co/products/')
        expect(`${link.label} ${link.url}`, `${slug} related link`).not.toMatch(/libhunt/i)
        expect(
          link.label === 'SERP Apps' && link.url?.startsWith('https://serp.ly/'),
          `${slug} serp.ly must not be labeled SERP Apps`
        ).toBe(false)
        if (link.label === 'SERP' || link.label === 'SERP AI') {
          expect(link.url, `${slug} ${link.label} route`).toMatch(/\/products\/.+\/reviews\/$/)
        }
      }

      const relatedUrls = new Set<string>()
      const relatedLabels = new Set<string>()
      for (const link of entry.relatedLinks ?? []) {
        const normalizedUrl = link.url?.replace(/\/+$/, '')
        expect(
          relatedUrls.has(normalizedUrl ?? ''),
          `${slug} duplicate related link ${link.url}`
        ).toBe(false)
        if (normalizedUrl) {
          relatedUrls.add(normalizedUrl)
        }
        expect(
          relatedLabels.has(link.label ?? ''),
          `${slug} duplicate related label ${link.label}`
        ).toBe(false)
        if (link.label) {
          relatedLabels.add(link.label)
        }
      }
    }
  })
})
