import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadCheckedInSite } from './site-config.ts'
import { resolveSiteContent } from '../packages/site-contract/src/site-content.ts'

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
    const siteProducts = readJson<Record<string, unknown>>(
      resolve(siteRoot, 'products.json')
    )
    const nextyCategories = readJson<Array<{ slug: string }>>(
      resolve(nextyExportRoot, 'categories.json')
    )
    const siteCategories = readJson<Array<{ slug: string }>>(
      resolve(siteRoot, 'categories.json')
    )

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
      tagline: bundle.siteConfig.tagLine,
    })
  })

  it('copies exported public assets into the wrapper public directory', () => {
    const assetManifest = readJson<
      Array<{ exportPath: string; sha256: string }>
    >(resolve(nextyExportRoot, 'asset-manifest.json'))

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
