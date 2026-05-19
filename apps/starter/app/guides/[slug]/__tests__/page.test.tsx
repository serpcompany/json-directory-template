import { render, screen } from '@/test/test-utils'

jest.mock('next-mdx-remote/rsc', () => ({
  MDXRemote: () => null
}))

jest.mock('remark-gfm', () => jest.fn())

const mockRenderGuideDetailPage = jest.fn(() => <div data-testid="guide-detail-page" />)
const mockGenerateGuideDetailMetadata = jest.fn(async () => ({
  description: 'mock guide detail metadata',
  title: 'mock guide detail title'
}))
const mockGenerateGuideDetailStaticParams = jest.fn(() => [{ slug: 'launch-notes' }])

jest.mock('@thedaviddias/web-core/guides/guide-page', () => ({
  GuideDetailPage: (props: unknown) => mockRenderGuideDetailPage(props),
  generateGuideDetailMetadata: (...args: unknown[]) => mockGenerateGuideDetailMetadata(...args),
  generateGuideDetailStaticParams: (...args: unknown[]) =>
    mockGenerateGuideDetailStaticParams(...args)
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
  brandsRouteBasePath: 'brands',
  description: 'Curated directory of listings and resources.',
  docsRouteBasePath: 'docs',
  features: {
    showGuides: true
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
  hasConfiguredPublicSocialLinks: jest.fn(() => true),
  getTwitterHandleFromUrl: jest.fn(() => '@serpcompany'),
  siteConfig: mockSiteConfig
}))

jest.mock('next/navigation', () => ({
  notFound: () => mockNotFound()
}))

jest.mock('@thedaviddias/web-core/json-ld', () => ({
  JsonLd: () => null
}))

jest.mock('@/lib/content-loader', () => ({
  getGuideBySlug: jest.fn(async () => ({
    authors: [{ name: 'Devin' }],
    category: 'implementation',
    content: '',
    date: '2026-04-01',
    description: 'Deep dive on the launch flow.',
    difficulty: 'intermediate',
    published: true,
    slug: 'launch-notes',
    title: 'Launch Notes'
  })),
  getGuides: jest.fn(async () => [])
}))

describe('GuidePage', () => {
  beforeEach(() => {
    mockSiteConfig.features.showGuides = true
    mockNotFound.mockReset()
  })

  it('blocks the route when guides are disabled for the site', async () => {
    mockSiteConfig.features.showGuides = false

    const { default: GuidePage } = await import('@/app/guides/[slug]/page')

    await GuidePage({
      params: Promise.resolve({
        slug: 'launch-notes'
      })
    })

    expect(mockNotFound).toHaveBeenCalled()
  })

  it('delegates guide metadata to the package-owned route module', async () => {
    const { generateMetadata } = await import('@/app/guides/[slug]/page')

    const metadata = await generateMetadata({
      params: Promise.resolve({
        slug: 'launch-notes'
      })
    })

    expect(mockGenerateGuideDetailMetadata).toHaveBeenCalled()
    expect(metadata).toEqual({
      description: 'mock guide detail metadata',
      title: 'mock guide detail title'
    })
  })

  it('uses not-found metadata when posts are disabled', async () => {
    mockSiteConfig.features.showGuides = false

    const { generateMetadata } = await import('@/app/guides/[slug]/page')
    const metadata = await generateMetadata({
      params: Promise.resolve({
        slug: 'launch-notes'
      })
    })

    expect(metadata.title).toBe('Page Not Found')
    expect(metadata.robots).toMatchObject({
      index: false,
      follow: false
    })
  })

  it('delegates guide detail rendering to the package-owned route module', async () => {
    const { default: GuidePage } = await import('@/app/guides/[slug]/page')

    const result = await GuidePage({
      params: Promise.resolve({
        slug: 'launch-notes'
      })
    })

    render(result)

    expect(screen.getByTestId('guide-detail-page')).toBeInTheDocument()
    expect(mockRenderGuideDetailPage).toHaveBeenCalled()
  })

  it('delegates guide static params generation to the package-owned route module', async () => {
    const { generateStaticParams } = await import('@/app/guides/[slug]/page')

    const params = await generateStaticParams()

    expect(mockGenerateGuideDetailStaticParams).toHaveBeenCalledWith([])
    expect(params).toEqual([{ slug: 'launch-notes' }])
  })
})
