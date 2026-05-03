import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadCheckedInSite } from './site-config.ts'
import { getActiveCheckedInSiteIds } from './validate-active-sites.ts'

describe('getActiveCheckedInSiteIds', () => {
  it('derives the active checked-in site ids from the live registry only', () => {
    expect(getActiveCheckedInSiteIds()).toEqual(['pornvideodownloaders.com', 'serpdownloaders.com'])
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
})
