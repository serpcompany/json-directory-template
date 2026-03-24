import { describe, expect, it } from 'vitest'
import { resolveBuildRun } from './resolve-build-run.ts'

describe('resolveBuildRun', () => {
  it('resolves the artifact dir from the checked-in site config id', () => {
    expect(
      resolveBuildRun([], {
        SITE_ID: 'serpdownloaders'
      })
    ).toEqual({
      artifactDir: 'dist/sites/serpdownloaders',
      siteId: 'serpdownloaders'
    })
  })

  it('falls back to the default checked-in site config when no site id is provided', () => {
    expect(resolveBuildRun([], {})).toEqual({
      artifactDir: 'dist/sites/default',
      siteId: 'default'
    })
  })
})
