import { describe, expect, it } from 'vitest'
import { resolveBuildRun } from './resolve-build-run.ts'

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
})
