import { render, screen } from '@/test/test-utils'

const mockNotFound = jest.fn()
const mockRenderFavoritesIndexPage = jest.fn(() => (
  <div data-testid="favorites-index-page" />
))
const mockSiteConfig = {
  branding: {
    logoUrl: '/logo.png'
  },
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

jest.mock('@/actions/get-home-page-data', () => ({
  getHomePageData: jest.fn(async () => ({
    allProjects: [],
    featuredProjects: [],
    recentlyUpdatedProjects: [],
    totalCount: 0
  }))
}))

jest.mock('@/lib/content-loader', () => ({
  getGuides: jest.fn(async () => [])
}))

jest.mock('@thedaviddias/web-core/favorites/index-page', () => ({
  FavoritesIndexPage: (props: unknown) => mockRenderFavoritesIndexPage(props),
  favoritesPageMetadata: {
    description: 'mock favorites metadata',
    title: 'mock favorites title'
  }
}))

jest.mock('@thedaviddias/web-core/site-config', () => ({
  hasConfiguredPublicSocialLinks: jest.fn(() => false),
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
    mockRenderFavoritesIndexPage.mockClear()
  })

  it('blocks the route when favorites are disabled for the site', async () => {
    const { default: FavoritesPage } = await import('@/app/favorites/page')

    await FavoritesPage()

    expect(mockNotFound).toHaveBeenCalled()
  })

  it('uses package-owned favorites metadata', async () => {
    mockSiteConfig.features.showFavorites = true

    const { metadata } = await import('@/app/favorites/page')

    expect(metadata).toEqual({
      description: 'mock favorites metadata',
      title: 'mock favorites title'
    })
  })

  it('delegates favorites rendering to the package-owned route module', async () => {
    mockSiteConfig.features.showFavorites = true

    const { default: FavoritesPage } = await import('@/app/favorites/page')

    render(await FavoritesPage())

    expect(screen.getByTestId('favorites-index-page')).toBeInTheDocument()
    expect(mockRenderFavoritesIndexPage).toHaveBeenCalled()
    expect(mockNotFound).not.toHaveBeenCalled()
  })
})
