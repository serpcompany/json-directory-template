import { describe, expect, it } from 'vitest'
import { resolveBuildRun } from './resolve-build-run.ts'

describe('resolveBuildRun', () => {
  it('resolves the artifact dir from an explicit build spec path', () => {
    expect(
      resolveBuildRun([], {
        BUILD_SPEC_PATH: 'sites/serpdownloaders/build-spec.json'
      })
    ).toEqual({
      artifactDir: 'dist/sites/serpdownloaders',
      siteId: 'serpdownloaders',
      specPath: 'sites/serpdownloaders/build-spec.json'
    })
  })

  it('falls back to the site id path when no spec path is provided', () => {
    expect(
      resolveBuildRun([], {
        SITE_ID: 'serpdownloaders'
      })
    ).toEqual({
      artifactDir: 'dist/sites/serpdownloaders',
      siteId: 'serpdownloaders'
    })
  })
})
