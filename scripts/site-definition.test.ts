import { describe, expect, it } from 'vitest'
import {
  buildSiteEnvironment,
  loadSiteDefinition,
  resolveSiteArtifactDir,
  resolveSiteSourcePlan
} from './site-definition.ts'

describe('loadSiteDefinition', () => {
  it('loads the checked-in serpdownloaders site definition', () => {
    const definition = loadSiteDefinition('serpdownloaders')

    expect(definition.id).toBe('serpdownloaders')
    expect(definition.source.kind).toBe('trial-products-json')
    expect(definition.site.domain).toBe('serpdownloaders.com')
    expect(definition.site.features.showDeveloperTools).toBe(false)
    expect(definition.site.features.showNewsletter).toBe(true)
    expect(definition.deploy?.strategy).toBe('github-pages-repo-sync')
  })
})

describe('resolveSiteArtifactDir', () => {
  it('resolves the configured artifact directory', () => {
    const definition = loadSiteDefinition('serpdownloaders')

    expect(resolveSiteArtifactDir(definition)).toMatch(/dist\/sites\/serpdownloaders$/)
  })
})

describe('buildSiteEnvironment', () => {
  it('maps a site definition to the app env contract', () => {
    const definition = loadSiteDefinition('serpdownloaders')

    expect(buildSiteEnvironment(definition)).toMatchObject({
      NEXT_PUBLIC_APP_URL: 'https://serpdownloaders.com',
      SITE_DESCRIPTION: 'Directory of download-focused browser tools.',
      SITE_DOMAIN: 'serpdownloaders.com',
      SITE_GITHUB_ISSUE_OWNER: 'serpcompany',
      SITE_GITHUB_ISSUE_REPO: 'json-directory-template',
      SITE_ID: 'serpdownloaders',
      SITE_NAME: 'SERP Downloaders',
      SITE_SHOW_DEVELOPER_TOOLS: 'false',
      SITE_SHOW_NEWSLETTER: 'true',
      SITE_TAGLINE: 'Download-focused product directory'
    })
  })
})

describe('resolveSiteSourcePlan', () => {
  it('describes how trial product JSON should be transformed for the active app', () => {
    const definition = loadSiteDefinition('serpdownloaders')

    expect(resolveSiteSourcePlan(definition)).toEqual({
      category: 'automation-workflow',
      featuredCount: 6,
      kind: 'trial-products-json',
      outputPath: 'data/websites.json',
      path: 'tmp/serpdownloaders.com/products.json',
      publishedAt: '2026-03-23'
    })
  })
})
