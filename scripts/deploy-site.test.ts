import { describe, expect, it } from 'vitest'
import { buildDeployPlan } from './deploy-site.ts'

describe('buildDeployPlan', () => {
  it('builds a deterministic deploy plan from the checked-in site config', () => {
    expect(buildDeployPlan({ siteId: 'serpdownloaders.com' })).toEqual({
      branch: 'main',
      buildDir: expect.stringMatching(/dist\/sites\/serpdownloaders.com$/),
      preserve: ['.github/workflows/deploy.yml', 'CNAME'],
      repoUrl: 'https://github.com/serpcompany/serpdownloaders.com.git',
      siteId: 'serpdownloaders.com',
      strategy: 'github-pages-repo-sync'
    })
  })

  it('throws when the selected site has no deploy target', () => {
    expect(() => buildDeployPlan({ siteId: 'default' })).toThrow(
      /does not define a deploy target/
    )
  })
})
