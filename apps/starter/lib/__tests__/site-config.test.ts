import {
  getConfiguredSocialLinks,
  hasConfiguredGitHubIssueTarget,
  hasConfiguredPublicSocialLinks,
  resolveSiteConfig
} from '@thedaviddias/web-core/site-config'

describe('resolveSiteConfig', () => {
  it('loads the checked-in per-site config for serpdownloaders.com', () => {
    const config = resolveSiteConfig('serpdownloaders.com')

    expect(config.name).toBe('SERP Downloaders')
    expect(config.domain).toBe('serpdownloaders.com')
    expect(config.description).toBe(
      'Browser extensions that save videos from YouTube, TikTok, Udemy, Vimeo and hundreds of other sites for offline viewing.'
    )
    expect(config.githubIssueOwner).toBe('serpcompany')
    expect(config.githubIssueRepo).toBe('serpdownloaders.com')
    expect(config.githubIssuesUrl).toBe('https://github.com/serpcompany/serpdownloaders.com/issues')
    expect(config.githubRepoUrl).toBe('https://github.com/serpapps')
    expect(config.githubUrl).toBe('https://github.com/serpapps')
    expect(config.publicUrl).toBe('https://serpdownloaders.com')
    expect(config.gtmId).toBe('GTM-M82HC3SC')
    expect(config.listingRouteBasePath).toBe('products')
    expect(config.docsRouteBasePath).toBe('docs')
    expect(config.networkRouteBasePath).toBe('network')
    expect(config.brandsRouteBasePath).toBe('brands')
    expect(config.copy).toEqual({
      brandsDescription:
        'Other websites in the SERP network, including SERP AI, SERP Apps and Browser Extensions IO.',
      brandsLabel: 'Brands',
      categoryLabels: {},
      docsLabel: 'Docs',
      homepage: {
        description:
          'Browser extensions that save videos from YouTube, TikTok, Udemy, Vimeo and 300+ other sites as MP4 files you keep for offline viewing.',
        heading: 'Video Downloader Browser Extensions',
        intro:
          'Pick the site you want to save videos from and get the SERP Downloaders extension built for it. Most add a download button to the video player and save files straight to your computer.',
        title: 'Video Downloader Browser Extensions | SERP Downloaders'
      },
      listingName: {
        plural: 'products',
        singular: 'product'
      },
      networkLabel: 'Network',
      submitLabel: 'Submit Yours'
    })
    expect(config.features).toEqual({
      showAuth: false,
      showBrands: true,
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
    for (const siteId of ['extensions.serp.co']) {
      expect(() => resolveSiteConfig(siteId)).toThrow(
        `Site "${siteId}" was removed from this repo. Use a supported checked-in site id instead.`
      )
    }
  })

  it('keeps public socials and resolves configured issue targets for active sites', () => {
    const config = resolveSiteConfig('serpdownloaders.com')

    expect(config.githubIssueOwner).toBe('serpcompany')
    expect(config.githubIssueRepo).toBe('serpdownloaders.com')
    expect(config.githubIssuesUrl).toBe('https://github.com/serpcompany/serpdownloaders.com/issues')
    expect(config.githubRepoUrl).toBe('https://github.com/serpapps')
    expect(config.githubUrl).toBe('https://github.com/serpapps')
    expect(config.listingRouteBasePath).toBe('products')
    expect(config.docsRouteBasePath).toBe('docs')
    expect(config.networkRouteBasePath).toBe('network')
    expect(config.brandsRouteBasePath).toBe('brands')
    expect(config.copy.brandsLabel).toBe('Brands')
    expect(config.copy.docsLabel).toBe('Docs')
    expect(config.copy.networkLabel).toBe('Network')
    expect(config.copy.submitLabel).toBe('Submit Yours')
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
    expect(config.brandsRouteBasePath).toBe('brands')
    expect(config.copy).toEqual({
      brandsLabel: 'Brands',
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

  it('treats checked-in site socials and issue targets as configured', () => {
    const config = resolveSiteConfig('serpdownloaders.com')

    expect(hasConfiguredGitHubIssueTarget(config)).toBe(true)
    expect(hasConfiguredPublicSocialLinks(config)).toBe(true)
    expect(getConfiguredSocialLinks(config)).toEqual([
      'https://github.com/serpapps',
      'https://www.reddit.com/r/serpdownloaders/',
      'https://x.com/serpdownloaders'
    ])
  })
})
