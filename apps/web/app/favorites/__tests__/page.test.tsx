const mockNotFound = jest.fn()
const mockSiteConfig = {
  copy: {
    listingName: {
      plural: 'listings',
      singular: 'listing'
    },
    submitLabel: 'Submit a Listing'
  },
  description: 'Curated directory of listings and resources.',
  docsRouteBasePath: 'docs',
  features: {
    showFavorites: false
  },
  listingRouteBasePath: 'listing',
  name: 'Directory Starter',
  networkRouteBasePath: 'network',
  publicUrl: 'https://example.com',
  tagline: 'Discover listings and resources',
  twitterUrl: 'https://x.com/serpcompany'
}

jest.mock('@/lib/site-config', () => ({
  getTwitterHandleFromUrl: jest.fn(() => '@serpcompany'),
  siteConfig: mockSiteConfig
}))

jest.mock('next/navigation', () => ({
  notFound: () => mockNotFound()
}))

describe('FavoritesPage', () => {
  beforeEach(() => {
    mockSiteConfig.features.showFavorites = false
    mockNotFound.mockReset()
  })

  it('blocks the route when favorites are disabled for the site', async () => {
    const { default: FavoritesPage } = await import('@/app/favorites/page')

    await FavoritesPage()

    expect(mockNotFound).toHaveBeenCalled()
  })
})
