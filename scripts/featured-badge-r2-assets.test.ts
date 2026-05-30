import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defaultSiteConfig, resolveCheckedInSiteConfig } from '@thedaviddias/site-contract'
import { activeCheckedInSiteIds } from '@thedaviddias/site-contract/active-site-ids'
import { describe, expect, it } from 'vitest'

const siteIds = [defaultSiteConfig.id, ...activeCheckedInSiteIds] as const
const variants = ['light', 'dark'] as const

type R2FeaturedBadgeAsset = {
  contentType?: string
  height?: number
  key?: string
  siteId?: string
  source?: string
  variant?: string
  width?: number
}

function loadAssetMap(): R2FeaturedBadgeAsset[] {
  return JSON.parse(
    readFileSync(resolve('scripts/r2-featured-badge-assets.json'), 'utf-8')
  ) as R2FeaturedBadgeAsset[]
}

function loadApprovedAssetMap(): R2FeaturedBadgeAsset[] {
  return JSON.parse(
    readFileSync(resolve('scripts/featured-badge-approved-r2-assets.json'), 'utf-8')
  ) as R2FeaturedBadgeAsset[]
}

function loadUploadAssetMaps(): R2FeaturedBadgeAsset[] {
  return [...loadAssetMap(), ...loadApprovedAssetMap()]
}

describe('featured badge R2 asset map', () => {
  it('maps every generated badge to the stable R2 badge key prefix', () => {
    const assetMap = loadAssetMap()
    const expectedAssets = siteIds.flatMap(siteId => {
      const config = resolveCheckedInSiteConfig(siteId)

      return variants.map(variant => {
        const filename = `featured-on-${siteId}-${variant}.svg`

        return {
          contentType: 'image/svg+xml',
          height: 50,
          key: `badge/${filename}`,
          siteId,
          source: `apps/${config.build.appPackageName}/public/badge/${filename}`,
          variant,
          width: 200
        }
      })
    })

    expect(assetMap).toEqual(expectedAssets)
  })

  it('only points at generated local SVG sources that exist for QC before upload', () => {
    const missingSources = loadAssetMap().filter(asset => {
      return !asset.source || !existsSync(resolve(asset.source))
    })

    expect(missingSources).toEqual([])
  })

  it('has 200x50 local SVGs for every badge key referenced by site config', () => {
    const brokenConfiguredBadges = siteIds.flatMap(siteId => {
      const config = resolveCheckedInSiteConfig(siteId)
      const configuredBadges = config.badges?.featuredOn
      const keys = [configuredBadges?.light, configuredBadges?.dark]

      if (!configuredBadges?.light || !configuredBadges.dark) {
        return [`${siteId}: missing explicit featuredOn badge config`]
      }

      return keys.flatMap(key => {
        if (!key) {
          return []
        }

        const source = resolve('apps', config.build.appPackageName, 'public', key)

        if (!existsSync(source)) {
          return [`${siteId}: missing ${key}`]
        }

        const svg = readFileSync(source, 'utf-8')
        return /<svg\b[^>]*width="200"[^>]*height="50"/.test(svg)
          ? []
          : [`${siteId}: not 200x50 ${key}`]
      })
    })

    expect(brokenConfiguredBadges).toEqual([])
  })

  it('includes every site-configured badge key in the R2 upload manifest', () => {
    const uploadedKeys = new Set(loadUploadAssetMaps().map(asset => asset.key))
    const missingConfiguredKeys = siteIds.flatMap(siteId => {
      const config = resolveCheckedInSiteConfig(siteId)
      const configuredBadges = config.badges?.featuredOn
      const keys = [configuredBadges?.light, configuredBadges?.dark].filter((key): key is string =>
        Boolean(key)
      )

      return keys.filter(key => !uploadedKeys.has(key)).map(key => `${siteId}: ${key}`)
    })

    expect(missingConfiguredKeys).toEqual([])
  })
})
