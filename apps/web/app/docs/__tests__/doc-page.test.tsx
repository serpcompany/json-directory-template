import { render, screen } from '@/test/test-utils'

jest.mock('next-mdx-remote/rsc', () => ({
  MDXRemote: () => null
}))

jest.mock('remark-gfm', () => jest.fn())

const mockRenderDocDetailPage = jest.fn(() => <div data-testid="doc-detail-page" />)
const mockGenerateDocDetailMetadata = jest.fn(async () => ({
  description: 'mock doc metadata',
  title: 'mock doc title',
}))
const mockGenerateDocDetailStaticParams = jest.fn(() => [{ slug: 'commands' }])

jest.mock('@thedaviddias/web-core/docs/doc-page', () => ({
  DocDetailPage: (props: unknown) => mockRenderDocDetailPage(props),
  generateDocDetailMetadata: (...args: unknown[]) => mockGenerateDocDetailMetadata(...args),
  generateDocDetailStaticParams: (...args: unknown[]) =>
    mockGenerateDocDetailStaticParams(...args),
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
  docsRouteBasePath: 'docs',
  features: {
    showDocs: true
  },
  listingRouteBasePath: 'listing',
  networkRouteBasePath: 'network',
  publicUrl: 'https://example.com',
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
    description: 'Install and use the CLI.',
    slug: 'cli-install',
    title: 'CLI Install'
  })),
  getDocs: jest.fn(() => [])
}))

describe('DocPage', () => {
  beforeEach(() => {
    mockSiteConfig.features.showDocs = true
    mockNotFound.mockReset()
  })

  it('blocks the route when docs are disabled for the site', async () => {
    mockSiteConfig.features.showDocs = false

    const { default: DocPage } = await import('@/app/docs/[slug]/page')

    await DocPage({
      params: Promise.resolve({
        slug: 'cli-install'
      })
    })

    expect(mockNotFound).toHaveBeenCalled()
  })

  it('uses generic documentation metadata on the configured docs route', async () => {
    const { generateMetadata } = await import('@/app/docs/[slug]/page')

    const metadata = await generateMetadata({
      params: Promise.resolve({
        slug: 'cli-install'
      })
    })

    expect(mockGenerateDocDetailMetadata).toHaveBeenCalled()
    expect(metadata).toEqual({
      description: 'mock doc metadata',
      title: 'mock doc title',
    })
  })

  it('uses not-found metadata when docs are disabled', async () => {
    mockSiteConfig.features.showDocs = false

    const { generateMetadata } = await import('@/app/docs/[slug]/page')

    const metadata = await generateMetadata({
      params: Promise.resolve({
        slug: 'cli-install'
      })
    })

    expect(metadata.title).toBe('Page Not Found')
    expect(metadata.robots).toMatchObject({
      index: false,
      follow: false
    })
  })

  it('delegates doc rendering to the package-owned route module', async () => {
    const { default: DocPage } = await import('@/app/docs/[slug]/page')

    const result = await DocPage({
      params: Promise.resolve({
        slug: 'cli-install'
      })
    })

    render(result)

    expect(screen.getByTestId('doc-detail-page')).toBeInTheDocument()
    expect(mockRenderDocDetailPage).toHaveBeenCalled()
  })

  it('delegates static params generation to the package-owned route module', async () => {
    const { generateStaticParams } = await import('@/app/docs/[slug]/page')

    const params = await generateStaticParams()

    expect(mockGenerateDocDetailStaticParams).toHaveBeenCalledWith([])
    expect(params).toEqual([{ slug: 'commands' }])
  })
})
