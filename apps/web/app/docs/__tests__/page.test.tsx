import { render, screen } from '@/test/test-utils'

jest.mock('next-mdx-remote/rsc', () => ({
  MDXRemote: () => null
}))

jest.mock('remark-gfm', () => jest.fn())

const mockRenderDocsIndexPage = jest.fn(() => <div data-testid="docs-index-page" />)
const mockGenerateDocsIndexMetadata = jest.fn(() => ({
  description: 'mock docs metadata',
  title: 'mock docs title',
}))

jest.mock('@thedaviddias/web-core/docs/index-page', () => ({
  DocsIndexPage: (props: unknown) => mockRenderDocsIndexPage(props),
  generateDocsIndexMetadata: (...args: unknown[]) => mockGenerateDocsIndexMetadata(...args),
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
    docsLabel: 'Docs',
    listingName: {
      plural: 'listings',
      singular: 'listing'
    },
    submitLabel: 'Submit a Listing'
  },
  description: 'Curated directory of listings and resources.',
  docsRouteBasePath: 'docs',
  features: {
    showDocs: true
  },
  listingRouteBasePath: 'listing',
  name: 'Directory Starter',
  networkRouteBasePath: 'network',
  publicUrl: 'https://example.com',
  tagline: 'Discover listings and resources',
  twitterUrl: 'https://x.com/serpcompany'
}

jest.mock('@thedaviddias/web-core/site-config', () => ({
  getConfiguredSocialLinks: jest.fn(() => ['https://x.com/serpcompany']),
  getTwitterHandleFromUrl: jest.fn(() => '@serpcompany'),
  hasConfiguredPublicSocialLinks: jest.fn(() => true),
  siteConfig: mockSiteConfig
}))

jest.mock('next/navigation', () => ({
  notFound: () => mockNotFound()
}))

jest.mock('@/lib/content-loader', () => ({
  getDocBySlug: jest.fn(async () => ({
    content: '',
    description: 'Start here for the current starter workflow.',
    slug: 'getting-started',
    title: 'Getting Started'
  }))
}))

describe('DocsPage', () => {
  beforeEach(() => {
    mockSiteConfig.features.showDocs = true
    mockNotFound.mockReset()
  })

  it('blocks the route when docs are disabled for the site', async () => {
    mockSiteConfig.features.showDocs = false

    const { default: DocsPage } = await import('@/app/docs/page')

    await DocsPage()

    expect(mockNotFound).toHaveBeenCalled()
  })

  it('uses the configured docs label in metadata instead of hardcoded documentation copy', async () => {
    const { generateMetadata } = await import('@/app/docs/page')
    const metadata = generateMetadata()

    expect(mockGenerateDocsIndexMetadata).toHaveBeenCalled()
    expect(metadata).toEqual({
      description: 'mock docs metadata',
      title: 'mock docs title',
    })
  })

  it('uses not-found metadata when docs are disabled', async () => {
    mockSiteConfig.features.showDocs = false

    const { generateMetadata } = await import('@/app/docs/page')
    const metadata = generateMetadata()

    expect(metadata.title).toBe('Page Not Found')
    expect(metadata.robots).toMatchObject({
      index: false,
      follow: false
    })
  })

  it('delegates docs index rendering to the package-owned route module', async () => {
    const { default: DocsPage } = await import('@/app/docs/page')

    const result = await DocsPage()

    render(result)

    expect(screen.getByTestId('docs-index-page')).toBeInTheDocument()
    expect(mockRenderDocsIndexPage).toHaveBeenCalled()
  })
})
