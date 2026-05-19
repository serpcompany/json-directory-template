const mockNotFound = jest.fn()
const notFoundError = new Error('NEXT_HTTP_ERROR_FALLBACK;404')
const mockSiteConfig = {
  branding: {
    appleTouchIconUrl: 'https://example.com/apple-touch-icon.png',
    faviconUrl: 'https://example.com/favicon.ico',
    logoUrl: 'https://example.com/logo.png',
    ogImageUrl: 'https://example.com/opengraph-image.png'
  },
  brandsRouteBasePath: 'brands',
  copy: {
    listingName: {
      plural: 'listings',
      singular: 'listing'
    },
    submitLabel: 'Submit a Listing'
  },
  docsRouteBasePath: 'docs',
  features: {
    showAuth: false
  },
  listingRouteBasePath: 'listing',
  name: 'Directory Starter',
  networkRouteBasePath: 'network',
  publicUrl: 'https://example.com',
  sitemap: {
    categoryBasePath: 'categories',
    listingDetailSuffix: undefined,
    staticPagePaths: []
  },
  tagline: 'Discover listings and resources',
  twitterUrl: 'https://x.com/serpcompany'
}

jest.mock('@thedaviddias/web-core/site-config', () => ({
  getTwitterHandleFromUrl: jest.fn(() => '@serpcompany'),
  hasConfiguredPublicSocialLinks: jest.fn(() => false),
  siteConfig: mockSiteConfig
}))

jest.mock('@/lib/auth', () => ({
  getSafeCallbackUrl: (value?: string) => value ?? '/account',
  getSession: jest.fn(async () => null)
}))

jest.mock('next/navigation', () => ({
  notFound: () => {
    mockNotFound()
    throw notFoundError
  },
  redirect: jest.fn()
}))

describe('AccountPage', () => {
  beforeEach(() => {
    mockSiteConfig.features.showAuth = false
    mockNotFound.mockReset()
  })

  it('blocks the route when auth is disabled for the site', async () => {
    const { default: AccountPage } = await import('@/app/account/page')

    await expect(AccountPage()).rejects.toThrow(notFoundError.message)

    expect(mockNotFound).toHaveBeenCalled()
  })
})
