jest.mock('next-mdx-remote/rsc', () => ({
  MDXRemote: () => null
}))

jest.mock('remark-gfm', () => jest.fn())

const mockNotFound = jest.fn()
const mockSiteConfig = {
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
  getTwitterHandleFromUrl: jest.fn(() => '@serpcompany'),
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
    const { getRoute } = await import('@thedaviddias/web-core/routes')

    const metadata = await generateMetadata({
      params: Promise.resolve({
        slug: 'cli-install'
      })
    })

    expect(metadata.title).toBe('CLI Install - Docs')
    expect(metadata.alternates?.canonical).toBe(`https://example.com${getRoute('docs.doc', { slug: 'cli-install' })}`)
    expect(metadata.keywords).toContain('documentation')
    expect(metadata.keywords).toContain('reference')
    expect(metadata.keywords).not.toContain('llmstxt-cli')
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
})
