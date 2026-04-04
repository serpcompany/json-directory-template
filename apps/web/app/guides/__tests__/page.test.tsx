import { render, screen } from '@/test/test-utils'

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
    showGuides: true
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

    expect(metadata.title).toBe('Posts')
    expect(metadata.description).toBe(
      `Browse posts, walkthroughs, and reference notes for ${mockSiteConfig.name}.`
    )
    expect(metadata.keywords).not.toContain('llms.txt guides')
  })

  it('renders post-oriented wrapper copy for the public posts index when enabled', async () => {
    const { default: GuidesPage } = await import('@/app/guides/page')

    render(await GuidesPage())

    expect(screen.getByRole('heading', { name: /^posts$/i })).toBeInTheDocument()
    expect(
      screen.getByText(/browse posts, walkthroughs, and reference notes for this directory/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/posts will appear here when this site publishes them/i)).toBeInTheDocument()
    expect(screen.queryByText(/llms\.txt/i)).not.toBeInTheDocument()
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
