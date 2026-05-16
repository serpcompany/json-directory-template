import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadCheckedInSite } from './site-config.ts'
import { getActiveCheckedInSiteIds } from './validate-active-sites.ts'

describe('getActiveCheckedInSiteIds', () => {
  it('derives the active checked-in site ids from the live registry only', () => {
    expect(getActiveCheckedInSiteIds()).toEqual([
      'browserextensions.io',
      'pornvideodownloaders.com',
      'serp.ai',
      'serp.software',
      'serpdownloaders.com'
    ])
  })

  it('requires every active checked-in site to expose the brands page', () => {
    for (const siteId of getActiveCheckedInSiteIds()) {
      const siteConfig = loadCheckedInSite(siteId)
      const brandsPagePath = resolve(
        process.cwd(),
        siteConfig.build.appOutDir,
        '../app/brands/page.tsx'
      )

      expect(siteConfig.features.showBrands, `${siteId} must enable /brands`).toBe(true)
      expect(existsSync(brandsPagePath), `${siteId} must scaffold app/brands/page.tsx`).toBe(true)
    }
  })

  it('requires every active checked-in site to expose its configured listing route', () => {
    for (const siteId of getActiveCheckedInSiteIds()) {
      const siteConfig = loadCheckedInSite(siteId)
      const appRoot = resolve(process.cwd(), siteConfig.build.appOutDir, '../app')
      const listingRoutePath = resolve(appRoot, siteConfig.routes.listingBasePath)

      expect(
        existsSync(resolve(listingRoutePath, 'page.tsx')),
        `${siteId} must scaffold app/${siteConfig.routes.listingBasePath}/page.tsx`
      ).toBe(true)
      expect(
        existsSync(resolve(listingRoutePath, '[slug]/page.tsx')),
        `${siteId} must scaffold app/${siteConfig.routes.listingBasePath}/[slug]/page.tsx`
      ).toBe(true)

      const nextConfigSource = readFileSync(resolve(appRoot, '../next.config.ts'), 'utf8')
      expect(nextConfigSource).not.toContain('createAliasRewrites(listingBasePath,')
    }
  })
})
