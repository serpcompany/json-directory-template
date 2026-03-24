import { resolveSiteConfig } from '@/lib/site-config'

describe('resolveSiteConfig', () => {
  it('loads the checked-in per-site config for serpdownloaders', () => {
    const config = resolveSiteConfig('serpdownloaders')

    expect(config.name).toBe('SERP Downloaders')
    expect(config.domain).toBe('serpdownloaders.com')
    expect(config.description).toBe('Directory of download-focused browser tools.')
    expect(config.githubIssueOwner).toBe('serpcompany')
    expect(config.githubIssueRepo).toBe('json-directory-template')
    expect(config.githubIssuesUrl).toBe(
      'https://github.com/serpcompany/json-directory-template/issues/new/choose'
    )
    expect(config.publicUrl).toBe('https://serpdownloaders.com')
    expect(config.listingRouteBasePath).toBe('websites')
    expect(config.copy).toEqual({
      listingName: {
        plural: 'listings',
        singular: 'listing'
      },
      submitLabel: 'Submit a Listing'
    })
    expect(config.features).toEqual({
      showAuth: false,
      showCreatorProjects: false,
      showDocs: false,
      showDeveloperTools: false,
      showFavorites: false,
      showFeaturedGuides: false,
      showGuides: false,
      showNewsletter: true,
      showProjects: false
    })
  })

  it('inherits default social and route values for sparse site overrides', () => {
    const config = resolveSiteConfig('serpdownloaders')

    expect(config.githubIssueOwner).toBe('serpcompany')
    expect(config.githubIssueRepo).toBe('json-directory-template')
    expect(config.githubIssuesUrl).toBe(
      'https://github.com/serpcompany/json-directory-template/issues/new/choose'
    )
    expect(config.listingRouteBasePath).toBe('websites')
    expect(config.copy.submitLabel).toBe('Submit a Listing')
  })

  it('falls back to the checked-in default site config', () => {
    const config = resolveSiteConfig('unknown-site')

    expect(config.id).toBe('default')
    expect(config.name).toBe('Directory Starter')
    expect(config.domain).toBe('example.com')
    expect(config.listingRouteBasePath).toBe('websites')
    expect(config.copy).toEqual({
      listingName: {
        plural: 'listings',
        singular: 'listing'
      },
      submitLabel: 'Submit a Listing'
    })
  })
})
