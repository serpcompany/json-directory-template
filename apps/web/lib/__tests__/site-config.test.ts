import {
  getConfiguredSocialLinks,
  hasConfiguredGitHubIssueTarget,
  hasConfiguredPublicSocialLinks,
  resolveSiteConfig
} from '@/lib/site-config'

describe('resolveSiteConfig', () => {
  it('loads the checked-in per-site config for serpdownloaders.com', () => {
    const config = resolveSiteConfig('serpdownloaders.com')

    expect(config.name).toBe('SERP Downloaders')
    expect(config.domain).toBe('serpdownloaders.com')
    expect(config.description).toBe(
      'A collection of tools to help you download anything from anywhere, anytime.'
    )
    expect(config.githubIssueOwner).toBe('serpcompany')
    expect(config.githubIssueRepo).toBe('json-directory-template')
    expect(config.githubIssuesUrl).toBe(
      'https://github.com/serpcompany/json-directory-template/issues/new/choose'
    )
    expect(config.githubRepoUrl).toBe('https://github.com/serpcompany/json-directory-template')
    expect(config.githubUrl).toBe('https://github.com/serpdownloaders')
    expect(config.publicUrl).toBe('https://serpdownloaders.com')
    expect(config.gtmId).toBe('GTM-M82HC3SC')
    expect(config.listingRouteBasePath).toBe('products')
    expect(config.docsRouteBasePath).toBe('docs')
    expect(config.networkRouteBasePath).toBe('network')
    expect(config.copy).toEqual({
      categoryLabels: {},
      docsLabel: 'Docs',
      listingName: {
        plural: 'products',
        singular: 'product'
      },
      networkLabel: 'Network',
      submitLabel: 'Submit a Product'
    })
    expect(config.features).toEqual({
      showAuth: false,
      showCreatorProjects: false,
      showDocs: false,
      showExternalResources: false,
      showFavorites: false,
      showFeaturedGuides: false,
      showGuides: false,
      showNewsletter: true,
      showProjects: false
    })
    expect(config.branding).toEqual({
      appleTouchIconUrl: '/apple-touch-icon.png',
      faviconUrl: '/favicon.ico',
      logoUrl: '/logo.png',
      opengraphImageUrl: '/opengraph-image.png'
    })
  })

  it('rejects parked site ids that were removed from the active registry', () => {
    for (const siteId of ['serp.co', 'serp.software', 'extensions.serp.co']) {
      expect(() => resolveSiteConfig(siteId)).toThrow(
        `Site "${siteId}" was removed from this repo. Use a supported checked-in site id instead.`
      )
    }
  })

  it('inherits default social and route values for sparse site overrides', () => {
    const config = resolveSiteConfig('serpdownloaders.com')

    expect(config.githubIssueOwner).toBe('serpcompany')
    expect(config.githubIssueRepo).toBe('json-directory-template')
    expect(config.githubIssuesUrl).toBe(
      'https://github.com/serpcompany/json-directory-template/issues/new/choose'
    )
    expect(config.githubRepoUrl).toBe('https://github.com/serpcompany/json-directory-template')
    expect(config.githubUrl).toBe('https://github.com/serpdownloaders')
    expect(config.listingRouteBasePath).toBe('products')
    expect(config.docsRouteBasePath).toBe('docs')
    expect(config.networkRouteBasePath).toBe('network')
    expect(config.copy.docsLabel).toBe('Docs')
    expect(config.copy.networkLabel).toBe('Network')
    expect(config.copy.submitLabel).toBe('Submit a Product')
  })

  it('falls back to the checked-in default site config only when no site id is provided', () => {
    const config = resolveSiteConfig()

    expect(config.id).toBe('default')
    expect(config.name).toBe('Directory Starter')
    expect(config.domain).toBe('example.com')
    expect(config.githubIssueOwner).toBe('example')
    expect(config.githubIssueRepo).toBe('directory-starter')
    expect(config.githubIssuesUrl).toBe(
      'https://github.com/example/directory-starter/issues/new/choose'
    )
    expect(config.githubRepoUrl).toBe('https://github.com/example/directory-starter')
    expect(config.githubUrl).toBe('https://github.com/example')
    expect(config.redditUrl).toBe('https://www.reddit.com/r/directorystarter/')
    expect(config.twitterUrl).toBe('https://x.com/directorystarter')
    expect(config.gtmId).toBeUndefined()
    expect(config.listingRouteBasePath).toBe('listing')
    expect(config.docsRouteBasePath).toBe('docs')
    expect(config.networkRouteBasePath).toBe('network')
    expect(config.copy).toEqual({
      categoryLabels: {},
      docsLabel: 'Docs',
      listingName: {
        plural: 'listings',
        singular: 'listing'
      },
      networkLabel: 'Network',
      submitLabel: 'Submit a Listing'
    })
    expect(config.branding).toEqual({
      appleTouchIconUrl: undefined,
      faviconUrl: undefined,
      logoUrl: undefined,
      opengraphImageUrl: undefined
    })
    expect(hasConfiguredGitHubIssueTarget(config)).toBe(false)
    expect(hasConfiguredPublicSocialLinks(config)).toBe(false)
    expect(getConfiguredSocialLinks(config)).toEqual([])
  })

  it('rejects unknown checked-in site ids instead of silently loading default', () => {
    expect(() => resolveSiteConfig('unknown-site')).toThrow(
      'Site "unknown-site" is not an active checked-in site in this repo. Use "default" or a supported checked-in site id instead.'
    )
  })

  it('treats checked-in example-site socials and issue targets as configured', () => {
    const config = resolveSiteConfig('serpdownloaders.com')

    expect(hasConfiguredGitHubIssueTarget(config)).toBe(true)
    expect(hasConfiguredPublicSocialLinks(config)).toBe(true)
    expect(getConfiguredSocialLinks(config)).toEqual([
      'https://github.com/serpdownloaders',
      'https://www.reddit.com/r/serpdownloaders/',
      'https://x.com/serpapps'
    ])
  })
})
