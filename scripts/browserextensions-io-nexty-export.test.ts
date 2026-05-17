import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { resolveSiteContent } from '../packages/site-contract/src/site-content.ts'
import { loadCheckedInSite } from './site-config.ts'

const nextyExportRoot = '/Users/devin/dev/repos/nexty-monorepo/tmp/browserextensions-io'
const siteRoot = resolve(process.cwd(), 'sites/browserextensions.io')
const appPublicRoot = resolve(process.cwd(), 'apps/browserextensions.io/public')
const appRoot = resolve(process.cwd(), 'apps/browserextensions.io')
const liveLegacyCategorySlugs = [
  'course-platforms',
  'image-downloader',
  'image-hosting',
  'livestream',
  'movies-and-tv',
  'social-media'
]

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function sha256(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

describe.runIf(existsSync(nextyExportRoot))('browserextensions.io nexty export parity', () => {
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
      [...nextyCategories.map(category => category.slug), ...liveLegacyCategorySlugs].sort()
    )
  })

  it('uses checked-in config values from the nexty export identity', () => {
    const config = loadCheckedInSite('browserextensions.io')
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
    expect(config.analytics?.gtmId).toBe('GTM-NL242383')
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

  it('does not keep copied serpdownloaders-only public media', () => {
    expect(existsSync(resolve(appPublicRoot, 'listing-logos/serpdownloaders.com'))).toBe(false)
    expect(
      existsSync(resolve(appPublicRoot, 'badge/featured-on-serpdownloaders.com-light.svg'))
    ).toBe(false)
    expect(
      existsSync(resolve(appPublicRoot, 'badge/featured-on-serpdownloaders.com-dark.svg'))
    ).toBe(false)
  })

  it('keeps wrapper route assets in sync with canonical browserextensions.io assets', () => {
    expect(sha256(resolve(appRoot, 'app/favicon.ico'))).toBe(
      sha256(resolve(siteRoot, 'assets/favicon.ico'))
    )
    expect(sha256(resolve(appRoot, 'app/opengraph-image.png'))).toBe(
      sha256(resolve(siteRoot, 'assets/opengraph-image.png'))
    )
  })

  it('keeps exported social profile links available in site content', () => {
    const content = resolveSiteContent('browserextensions.io')
    const hrefs = content.networkLinks.map(link => link.href)

    expect(hrefs).toContain('https://www.linkedin.com/company/browserextensions-io')
    expect(hrefs).toContain('https://www.youtube.com/@browserextensionsio')
  })

  it('does not keep stale serpdownloaders media URLs in product data', () => {
    const siteProducts = readJson<Record<string, unknown>>(resolve(siteRoot, 'products.json'))

    expect(JSON.stringify(siteProducts)).not.toContain('serpdownloaders')
  })
})

describe('browserextensions.io checked-in downloader products', () => {
  it('keeps the 75-record catalog rich without serpdownloaders media or generic links', () => {
    const siteProducts = readJson<
      Record<
        string,
        {
          content?: {
            body?: string
            faq?: Array<{ answer?: string; question?: string }>
          }
          product?: { productPage?: string; slug?: string }
          media?: { images?: string[]; logo?: string; video?: string }
          relatedLinks?: Array<{ label?: string; url?: string }>
        }
      >
    >(resolve(siteRoot, 'products.json'))

    expect(Object.keys(siteProducts)).toHaveLength(75)

    for (const [key, entry] of Object.entries(siteProducts)) {
      const slug = entry.product?.slug ?? key
      const body = entry.content?.body ?? ''

      expect(entry.product?.productPage, slug).toMatch(/^https:\/\/serp\.ly\/.+/)
      expect(body, slug).not.toContain('https://apps.serp.co/')
      expect(entry.content?.faq?.length, slug).toBeGreaterThanOrEqual(3)
      expect(JSON.stringify(entry.media ?? {}), `${slug} media`).not.toContain('serpdownloaders')

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
        if (link.label === 'Browser Extensions') {
          expect(link.url, `${slug} Browser Extensions route`).toMatch(/\/products\/.+\/$/)
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
