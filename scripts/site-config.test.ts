import { describe, expect, it } from 'vitest'
import {
  buildSiteEnvironment,
  loadCheckedInSite,
  resolveResolvedSiteConfig,
  resolveSiteArtifactDir
} from './site-config.ts'

describe('loadCheckedInSite', () => {
  it('loads the checked-in serpdownloaders site config', () => {
    const config = loadCheckedInSite('serpdownloaders')

    expect(config.id).toBe('serpdownloaders')
    expect(config.content.listingSource.kind).toBe('trial-products-json')
    expect(config.site.domain).toBe('serpdownloaders.com')
    expect(config.routes.listingBasePath).toBe('websites')
    expect(config.routes.docsBasePath).toBe('docs')
    expect(config.routes.networkBasePath).toBe('network')
    expect(config.copy).toEqual({
      docsLabel: 'Docs',
      listingName: {
        plural: 'listings',
        singular: 'listing'
      },
      networkLabel: 'Network',
      submitLabel: 'Submit a Listing'
    })
    expect(config.features.showAuth).toBe(false)
    expect(config.features.showDocs).toBe(false)
    expect(config.features.showDeveloperTools).toBe(false)
    expect(config.features.showFavorites).toBe(false)
    expect(config.features.showGuides).toBe(false)
    expect(config.features.showNewsletter).toBe(true)
    expect(config.features.showProjects).toBe(false)
    expect(config.deploy?.strategy).toBe('github-pages-repo-sync')
  })

  it('inherits default values when a site override does not redefine them', () => {
    const config = loadCheckedInSite('serpdownloaders')

    expect(config.social.githubIssueOwner).toBe('serpcompany')
    expect(config.social.githubIssueRepo).toBe('json-directory-template')
    expect(config.social.githubIssuesUrl).toBe(
      'https://github.com/serpcompany/json-directory-template/issues/new/choose'
    )
    expect(config.routes.listingBasePath).toBe('websites')
    expect(config.routes.docsBasePath).toBe('docs')
    expect(config.routes.networkBasePath).toBe('network')
    expect(config.copy.submitLabel).toBe('Submit a Listing')
    expect(config.copy.docsLabel).toBe('Docs')
    expect(config.copy.networkLabel).toBe('Network')
    expect(config.features.showNewsletter).toBe(true)
  })

  it('loads the checked-in default site config when no site id is provided', () => {
    const config = loadCheckedInSite()

    expect(config.id).toBe('default')
    expect(config.site.domain).toBe('example.com')
    expect(config.content.listingSource.kind).toBe('listing-json')
    expect(config.routes.listingBasePath).toBe('websites')
    expect(config.routes.docsBasePath).toBe('docs')
    expect(config.routes.networkBasePath).toBe('network')
    expect(config.copy.listingName.singular).toBe('listing')
    expect(config.copy.docsLabel).toBe('Docs')
    expect(config.copy.networkLabel).toBe('Network')
  })
})

describe('resolveSiteArtifactDir', () => {
  it('resolves the configured artifact directory', () => {
    expect(resolveSiteArtifactDir(loadCheckedInSite('serpdownloaders'))).toBe(
      'dist/sites/serpdownloaders'
    )
  })
})

describe('buildSiteEnvironment', () => {
  it('maps a checked-in site config to the minimal app env contract', () => {
    expect(buildSiteEnvironment(loadCheckedInSite('serpdownloaders'))).toEqual({
      LISTING_ROUTE_BASE_PATH: 'websites',
      NEXT_PUBLIC_LISTING_ROUTE_BASE_PATH: 'websites',
      NEXT_PUBLIC_SITE_ID: 'serpdownloaders',
      SITE_ID: 'serpdownloaders'
    })
  })
})

describe('resolveResolvedSiteConfig', () => {
  it('resolves the checked-in site config into the app-facing shape', () => {
    expect(resolveResolvedSiteConfig(loadCheckedInSite('serpdownloaders'))).toMatchObject({
      copy: {
        listingName: {
          plural: 'listings',
          singular: 'listing'
        },
        submitLabel: 'Submit a Listing'
      },
      description: 'Directory of download-focused browser tools.',
      domain: 'serpdownloaders.com',
      githubIssueOwner: 'serpcompany',
      githubIssueRepo: 'json-directory-template',
      id: 'serpdownloaders',
      docsRouteBasePath: 'docs',
      listingRouteBasePath: 'websites',
      name: 'SERP Downloaders',
      networkRouteBasePath: 'network',
      publicUrl: 'https://serpdownloaders.com',
      tagline: 'Download-focused product directory'
    })
  })
})
