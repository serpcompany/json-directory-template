import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
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

  it('builds a deterministic deploy plan for pornvideodownloaders.com', () => {
    expect(buildDeployPlan({ siteId: 'pornvideodownloaders.com' })).toEqual({
      branch: 'main',
      buildDir: expect.stringMatching(/dist\/sites\/pornvideodownloaders.com$/),
      preserve: ['.github/workflows/deploy.yml', 'CNAME'],
      repoUrl: 'https://github.com/serpcompany/pornvideodownloaders.com.git',
      siteId: 'pornvideodownloaders.com',
      strategy: 'github-pages-repo-sync'
    })
  })

  it('builds a deterministic deploy plan for serp.software', () => {
    expect(buildDeployPlan({ siteId: 'serp.software' })).toEqual({
      branch: 'main',
      buildDir: expect.stringMatching(/dist\/sites\/serp.software$/),
      preserve: ['.github/workflows/deploy.yml', 'CNAME'],
      repoUrl: 'https://github.com/serpcompany/serp.software.git',
      siteId: 'serp.software',
      strategy: 'github-pages-repo-sync'
    })
  })

  it('builds a deterministic deploy plan for browserextensions.io', () => {
    expect(buildDeployPlan({ siteId: 'browserextensions.io' })).toEqual({
      branch: 'main',
      buildDir: expect.stringMatching(/dist\/sites\/browserextensions.io$/),
      preserve: ['.github/workflows/deploy.yml', 'CNAME'],
      repoUrl: 'https://github.com/serpcompany/browserextensions.io.git',
      siteId: 'browserextensions.io',
      strategy: 'github-pages-repo-sync'
    })
  })

  it('throws when the selected site has no deploy target', () => {
    expect(() => buildDeployPlan({ siteId: 'default' })).toThrow(
      /does not define a deploy target/
    )
  })

  it('enables GitHub Pages in the target deploy workflow', () => {
    const workflowSource = readFileSync(
      resolve(process.cwd(), 'scripts/templates/target-pages-deploy.yml'),
      'utf8'
    )

    expect(workflowSource).toContain('uses: actions/configure-pages@v5')
    expect(workflowSource).toContain('enablement: true')
  })
})
