jest.mock('@/lib/content-loader', () => ({
  getDocs: jest.fn(() => [
    { slug: 'commands' },
    { slug: 'getting-started' },
  ]),
  getGuides: jest.fn(() => [
    { slug: 'how-to-download-onlyfans-profiles-videos-images' },
  ]),
  getWebsites: jest.fn(() => [
    {
      category: 'developer-tools',
      featured: true,
      publishedAt: '2026-03-22',
      slug: 'example-listing',
    },
  ]),
}))

describe('sitemap routes', () => {
  it('advertises sitemap-index.xml from robots.txt', async () => {
    const robots = await import('../robots')

    expect(robots.default()).toMatchObject({
      sitemap: 'https://example.com/sitemap-index.xml',
    })
  })

  it('redirects sitemap.xml to the canonical sitemap index', async () => {
    const sitemap = await import('../sitemap.xml/route')

    const response = await sitemap.GET()

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'https://example.com/sitemap-index.xml'
    )
  })

  it('includes split sitemap families in sitemap-index.xml', async () => {
    const sitemapIndex = await import('../sitemap-index.xml/route')

    const response = await sitemapIndex.GET()
    const xml = await response.text()

    expect(response.headers.get('content-type')).toContain('application/xml')
    expect(xml).toContain('<loc>https://example.com/pages-sitemap.xml</loc>')
    expect(xml).toContain('<loc>https://example.com/listings-sitemap.xml</loc>')
    expect(xml).toContain('<loc>https://example.com/taxonomies-sitemap.xml</loc>')
    expect(xml).not.toContain('docs-sitemap.xml')
    expect(xml).not.toContain('posts-sitemap.xml')
  })

  it('splits static, listing, taxonomy, docs, and posts URLs into the expected families', async () => {
    const pagesSitemap = await import('../pages-sitemap.xml/route')
    const listingsSitemap = await import('../listings-sitemap.xml/route')
    const taxonomiesSitemap = await import('../taxonomies-sitemap.xml/route')
    const docsSitemap = await import('../docs-sitemap.xml/route')
    const postsSitemap = await import('../posts-sitemap.xml/route')

    const [pagesXml, listingsXml, taxonomiesXml, docsXml, postsXml] = await Promise.all([
      pagesSitemap.GET().then(response => response.text()),
      listingsSitemap.GET().then(response => response.text()),
      taxonomiesSitemap.GET().then(response => response.text()),
      docsSitemap.GET().then(response => response.text()),
      postsSitemap.GET().then(response => response.text()),
    ])

    expect(pagesXml).toContain('<loc>https://example.com/</loc>')
    expect(pagesXml).toContain('<loc>https://example.com/about</loc>')
    expect(pagesXml).toContain('<loc>https://example.com/legal/privacy</loc>')
    expect(pagesXml).not.toContain('https://example.com/brands')
    expect(pagesXml).not.toContain('https://example.com/listing')

    expect(listingsXml).toContain(
      '<loc>https://example.com/listing/example-listing</loc>'
    )
    expect(listingsXml).not.toContain('https://example.com/categories/')

    expect(taxonomiesXml).toContain('<loc>https://example.com/listing</loc>')
    expect(taxonomiesXml).toContain(
      '<loc>https://example.com/categories/featured</loc>'
    )

    expect(docsXml).toBe(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>'
    )
    expect(postsXml).toBe(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>'
    )
  })
})
