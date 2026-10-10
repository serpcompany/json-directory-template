import { afterEach, describe, expect, it, vi } from 'vitest'

type ListingBreadcrumbsModule = typeof import('./listing-breadcrumbs')
type SeoConfigModule = typeof import('./seo-config')
type SchemaModule = typeof import('./schema')
type CollectionPageSchemaModule = typeof import('./category-routes/collection-page-schema')

async function importForSite<T>(siteId: string, path: string): Promise<T> {
  vi.resetModules()
  vi.stubEnv('NEXT_PUBLIC_SITE_ID', siteId)
  return (await import(path)) as T
}

const listing = {
  category: 'video-downloaders',
  description: 'Save videos.',
  name: 'Example Downloader',
  publishedAt: '2026-03-24',
  slug: 'example-downloader',
  website: 'https://serp.ly/example-downloader'
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('404 metadata', () => {
  it('omits the canonical and og:url when canonical is false', async () => {
    const { generateBaseMetadata } = await importForSite<SeoConfigModule>(
      'serpdownloaders.com',
      './seo-config'
    )
    const metadata = generateBaseMetadata({
      canonical: false,
      description: 'Missing page.',
      noindex: true,
      title: 'Page Not Found'
    })

    expect(metadata.alternates).toBeUndefined()
    expect(metadata.openGraph).not.toHaveProperty('url')
    expect(metadata.robots).toMatchObject({ follow: false, index: false })
  })

  it('keeps the absolute canonical by default', async () => {
    const { generateBaseMetadata } = await importForSite<SeoConfigModule>(
      'serpdownloaders.com',
      './seo-config'
    )

    expect(
      generateBaseMetadata({ description: 'About.', path: '/about/', title: 'About' }).alternates
    ).toEqual({ canonical: 'https://serpdownloaders.com/about/' })
  })
})

describe('listing detail breadcrumbs', () => {
  it.each(['browserextensions.io', 'serp.ai', 'serpdownloaders.com'])(
    'uses Home > Category > Listing on %s, which keeps the listing index out of the sitemap',
    async siteId => {
      const { getListingDetailBreadcrumbItems } = await importForSite<ListingBreadcrumbsModule>(
        siteId,
        './listing-breadcrumbs'
      )
      const { getRoute } = await import('./routes')
      const items = getListingDetailBreadcrumbItems(listing)

      expect(items).toEqual([
        {
          href: getRoute('category.page', { category: 'video-downloaders' }),
          name: 'Video Downloaders'
        },
        { href: getRoute('listing.detail', { slug: listing.slug }), name: listing.name }
      ])
      expect(items.map(item => item.href)).not.toContain('/')
    }
  )

  it('uses the listing index when it is a canonical page (starter default)', async () => {
    const { getListingDetailBreadcrumbItems } = await importForSite<ListingBreadcrumbsModule>(
      'default',
      './listing-breadcrumbs'
    )
    const { routes } = await import('./routes')
    const { siteCopy } = await import('./site-copy')

    expect(getListingDetailBreadcrumbItems(listing)[0]).toEqual({
      href: routes.listing.list,
      name: siteCopy.listingName.pluralTitle
    })
  })

  it('falls back to Home > Listing when the listing has no category', async () => {
    const { getListingDetailBreadcrumbItems } = await importForSite<ListingBreadcrumbsModule>(
      'serpdownloaders.com',
      './listing-breadcrumbs'
    )

    expect(getListingDetailBreadcrumbItems({ ...listing, category: '' })).toEqual([
      { href: '/products/example-downloader/', name: listing.name }
    ])
  })
})

describe('listing detail JSON-LD', () => {
  it('leaves the BreadcrumbList to the visible breadcrumb and claims no price', async () => {
    const { generateWebsiteDetailSchema } = await importForSite<SchemaModule>(
      'serpdownloaders.com',
      './schema'
    )
    const graph = generateWebsiteDetailSchema(listing)['@graph'] as Array<Record<string, unknown>>
    const webPage = graph.find(node => node['@type'] === 'WebPage')
    const software = graph.find(node => node['@type'] === 'SoftwareApplication')

    expect(graph.filter(node => node['@type'] === 'BreadcrumbList')).toEqual([])
    expect(webPage).not.toHaveProperty('breadcrumb')
    expect(webPage?.isPartOf).toEqual({ '@id': 'https://serpdownloaders.com/#website' })
    expect(software).not.toHaveProperty('offers')
    expect(software).not.toHaveProperty('aggregateRating')
    expect(software).not.toHaveProperty('review')
  })
})

describe('category CollectionPage JSON-LD', () => {
  it('uses only schema.org properties valid for each type, with on-site absolute item URLs', async () => {
    const { buildListingCollectionPageSchema } =
      await importForSite<CollectionPageSchemaModule>(
        'serpdownloaders.com',
        './category-routes/collection-page-schema'
      )
    const listings = Array.from({ length: 25 }, (_, index) => ({
      name: `Listing ${index}`,
      slug: `listing-${index}.pages.dev`
    }))
    const schema = buildListingCollectionPageSchema({
      dates: { dateModified: '2026-03-24', datePublished: '2026-03-24' },
      description: 'Explore listings.',
      headline: '25+ Video Downloaders Products',
      itemListDescription: 'Video downloaders.',
      itemListName: 'Video Downloaders Products',
      listings,
      name: 'Video Downloaders - SERP Downloaders',
      url: 'https://serpdownloaders.com/categories/video-downloaders/'
    })
    const mainEntity = schema.mainEntity as {
      itemListElement: Array<Record<string, unknown>>
      numberOfItems: number
    }

    expect(schema['@type']).toBe('CollectionPage')
    expect(schema).not.toHaveProperty('itemListElement')
    expect(schema).not.toHaveProperty('numberOfItems')
    expect(schema).not.toHaveProperty('breadcrumb')
    expect(schema.isPartOf).toMatchObject({ '@id': 'https://serpdownloaders.com/#website' })
    expect(mainEntity.numberOfItems).toBe(25)
    expect(mainEntity.itemListElement).toHaveLength(20)
    expect(mainEntity.itemListElement[0]).toEqual({
      '@type': 'ListItem',
      name: 'Listing 0',
      position: 1,
      url: 'https://serpdownloaders.com/products/listing-0.pages.dev/'
    })
    for (const item of mainEntity.itemListElement) {
      expect(item['@type']).toBe('ListItem')
      expect(String(item.url)).toMatch(/^https:\/\/serpdownloaders\.com\/products\/.+\/$/)
    }
  })
})
