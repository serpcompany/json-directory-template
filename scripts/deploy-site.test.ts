import { describe, expect, it } from 'vitest'
import { buildDeployPlan } from './deploy-site.ts'

describe('buildDeployPlan', () => {
  it('builds a deterministic deploy plan from the checked-in site definition', () => {
    expect(buildDeployPlan({ siteId: 'serpdownloaders' })).toEqual({
      branch: 'main',
      buildDir: expect.stringMatching(/dist\/sites\/serpdownloaders$/),
      preserve: ['.github/workflows/deploy.yml', 'CNAME'],
      repoUrl: 'https://github.com/serpcompany/serpdownloaders.com.git',
      siteId: 'serpdownloaders',
      strategy: 'github-pages-repo-sync'
    })
  })

  it('builds the same deploy plan from an explicit build spec path', () => {
    expect(buildDeployPlan({ specPath: 'sites/serpdownloaders/build-spec.json' })).toEqual({
      branch: 'main',
      buildDir: expect.stringMatching(/dist\/sites\/serpdownloaders$/),
      preserve: ['.github/workflows/deploy.yml', 'CNAME'],
      repoUrl: 'https://github.com/serpcompany/serpdownloaders.com.git',
      siteId: 'serpdownloaders',
      strategy: 'github-pages-repo-sync'
    })
  })
})
