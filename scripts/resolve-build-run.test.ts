import { describe, expect, it } from 'vitest'
import { inferSiteIdFromChangedPaths, resolveBuildRun } from './resolve-build-run.ts'

describe('resolveBuildRun', () => {
  it('resolves the artifact dir from the checked-in site config id', () => {
    expect(
      resolveBuildRun([], {
        SITE_ID: 'serpdownloaders.com'
      })
    ).toEqual({
      artifactDir: 'dist/sites/serpdownloaders.com',
      siteId: 'serpdownloaders.com'
    })
  })

  it('falls back to the default checked-in site config when no site id is provided', () => {
    expect(resolveBuildRun([], {})).toEqual({
      artifactDir: 'dist/sites/default',
      siteId: 'default'
    })
  })

  it('rejects removed checked-in site ids instead of falling back to default', () => {
    expect(() =>
      resolveBuildRun([], {
        SITE_ID: 'extensions.serp.co'
      })
    ).toThrow(
      'Site "extensions.serp.co" was removed from this repo. Use a supported checked-in site id instead.'
    )
  })

  it('rejects unknown checked-in site ids instead of silently loading default', () => {
    expect(() =>
      resolveBuildRun([], {
        SITE_ID: 'unknown-site'
      })
    ).toThrow(
      'Site "unknown-site" is not an active checked-in site in this repo. Use "default" or a supported checked-in site id instead.'
    )
  })

  it('infers a single checked-in site id from changed wrapper app paths', () => {
    expect(
      inferSiteIdFromChangedPaths([
        'apps/serp.co/lib/content-loader.ts',
        'apps/serp.co/app/products/[slug]/reviews/page.tsx'
      ])
    ).toBe('serp.co')
  })

  it('infers a single checked-in site id from changed site config paths', () => {
    expect(inferSiteIdFromChangedPaths(['sites/serp.co/site-config.ts'])).toBe('serp.co')
  })

  it('maps starter app changes to the default checked-in site', () => {
    expect(inferSiteIdFromChangedPaths(['apps/starter/app/layout.tsx'])).toBe('default')
  })

  it('requires explicit site selection when push paths touch multiple sites', () => {
    expect(() =>
      inferSiteIdFromChangedPaths(['apps/serp.co/app/layout.tsx', 'apps/serp.ai/app/layout.tsx'])
    ).toThrow(
      'Push changed multiple site-specific paths (serp.ai, serp.co). Set SITE_ID explicitly or run workflow_dispatch for one site.'
    )
  })
})
