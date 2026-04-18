import { render, screen } from '@/test/test-utils'

const mockRenderGuidesIndexPage = jest.fn(() => <div data-testid="guides-index-page" />)
const mockGenerateGuidesIndexMetadata = jest.fn(() => ({
  description: 'mock guides metadata',
  title: 'mock guides title',
}))

jest.mock('@thedaviddias/web-core/guides/index-page', () => ({
  GuidesIndexPage: (props: unknown) => mockRenderGuidesIndexPage(props),
  generateGuidesIndexMetadata: (...args: unknown[]) => mockGenerateGuidesIndexMetadata(...args),
}))

const mockNotFound = jest.fn()
const mockSiteConfig = {
  branding: {
    appleTouchIconUrl: 'https://example.com/apple-touch-icon.png',
    faviconUrl: 'https://example.com/favicon.ico',
    logoUrl: 'https://example.com/logo.png',
    ogImageUrl: 'https://example.com/opengraph-image.png'
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
    showGuides: true
  },
  listingRouteBasePath: 'listing',
  name: 'Directory Starter',
  networkRouteBasePath: 'network',
  publicUrl: 'https://example.com',
  tagline: 'Discover listings and resources',
  twitterUrl: 'https://x.com/serpcompany'
}

jest.mock('@thedaviddias/web-core/site-config', () => ({
  hasConfiguredPublicSocialLinks: jest.fn(() => true),
  getTwitterHandleFromUrl: jest.fn(() => '@serpcompany'),
  siteConfig: mockSiteConfig
}))

jest.mock('next/navigation', () => ({
  notFound: () => mockNotFound()
}))

jest.mock('@thedaviddias/design-system/breadcrumb', () => ({
  Breadcrumb: () => <nav aria-label="breadcrumb" />
}))

jest.mock('@/components/json-ld', () => ({
  JsonLd: () => null
}))

jest.mock('@/lib/content-loader', () => ({
  getGuides: jest.fn(async () => [])
}))

describe('GuidesPage', () => {
  beforeEach(() => {
    mockSiteConfig.features.showGuides = true
    mockNotFound.mockReset()
  })

  it('blocks the route when guides are disabled for the site', async () => {
    mockSiteConfig.features.showGuides = false

    const { default: GuidesPage } = await import('@/app/guides/page')

    await GuidesPage()

    expect(mockNotFound).toHaveBeenCalled()
  })

  it('uses post metadata instead of the old guides route copy', async () => {
    const { generateMetadata } = await import('@/app/guides/page')
    const metadata = generateMetadata()

    expect(mockGenerateGuidesIndexMetadata).toHaveBeenCalled()
    expect(metadata).toEqual({
      description: 'mock guides metadata',
      title: 'mock guides title',
    })
  })

  it('delegates the posts index rendering to the package-owned route module', async () => {
    const { default: GuidesPage } = await import('@/app/guides/page')

    render(await GuidesPage())

    expect(screen.getByTestId('guides-index-page')).toBeInTheDocument()
    expect(mockRenderGuidesIndexPage).toHaveBeenCalled()
  })

  it('uses not-found metadata when posts are disabled', async () => {
    mockSiteConfig.features.showGuides = false

    const { generateMetadata } = await import('@/app/guides/page')
    const metadata = generateMetadata()

    expect(metadata.title).toBe('Page Not Found')
    expect(metadata.robots).toMatchObject({
      index: false,
      follow: false
    })
  })
})
