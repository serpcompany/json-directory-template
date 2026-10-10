import { Package } from 'lucide-react'
import React, { isValidElement, type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Category } from './categories'
import type { WebsiteMetadata } from './content-query'

type SiteConfigModule = typeof import('./site-config')

// Loads web-core for a checked-in site, optionally layering config overrides on top of it.
async function withSite(
  siteId: string,
  override: (config: SiteConfigModule['siteConfig']) => SiteConfigModule['siteConfig'] = config =>
    config
) {
  vi.resetModules()
  vi.stubEnv('NEXT_PUBLIC_SITE_ID', siteId)
  vi.doMock('./site-config', async importOriginal => {
    const original = await importOriginal<SiteConfigModule>()

    return { ...original, siteConfig: override(original.siteConfig) }
  })
}

function listing(slug: string, categories: string[], name = slug): WebsiteMetadata {
  return {
    category: categories[0] ?? '',
    categories,
    description: `${name} description.`,
    name,
    publishedAt: '2026-03-24',
    slug,
    website: `https://serp.ly/${slug}`
  }
}

beforeEach(() => {
  vi.stubGlobal('React', React)
})

afterEach(() => {
  vi.doUnmock('./site-config')
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('category meta titles', () => {
  it('uses "<Category>: <n>+ <Listings>" when the rendered title fits in 60 characters', async () => {
    await withSite('serpdownloaders.com')
    const { buildCategoryMetaTitle } = await import('./category-seo')
    const title = buildCategoryMetaTitle({
      categoryName: 'Video Downloaders',
      listingCount: 338,
      siteName: 'SERP Downloaders'
    })

    expect(title).toBe('Video Downloaders: 338+ Products')
    expect(`${title} | SERP Downloaders`.length).toBeLessThanOrEqual(60)
  })

  it('falls back to shorter forms for long category names', async () => {
    await withSite('serpdownloaders.com')
    const { buildCategoryMetaTitle } = await import('./category-seo')

    expect(
      buildCategoryMetaTitle({
        categoryName: 'Course Platform Video Downloaders',
        listingCount: 40,
        siteName: 'SERP Downloaders'
      })
    ).toBe('Course Platform Video Downloaders (40+)')
    expect(
      buildCategoryMetaTitle({
        categoryName: 'An Extremely Long Category Name For Testing Purposes',
        listingCount: 40,
        siteName: 'SERP Downloaders'
      })
    ).toBe('An Extremely Long Category Name For Testing Purposes')
  })
})

describe('category meta descriptions', () => {
  it('keeps whole sentences within 160 characters', async () => {
    await withSite('serpdownloaders.com')
    const { buildCategoryMetaDescription } = await import('./category-seo')
    const description = buildCategoryMetaDescription([
      'Explore 338+ video downloaders products',
      'Downloaders, recorders, and browser tools for saving online video from hundreds of sites',
      'This third sentence would push the description past the limit and must be dropped'
    ])

    expect(description).toBe(
      'Explore 338+ video downloaders products. Downloaders, recorders, and browser tools for saving online video from hundreds of sites.'
    )
    expect(description.length).toBeLessThanOrEqual(160)
    expect(description).not.toContain('...')
  })

  it('shortens only an over-long first sentence, at a word boundary', async () => {
    await withSite('serpdownloaders.com')
    const { buildCategoryMetaDescription } = await import('./category-seo')
    const description = buildCategoryMetaDescription(['word '.repeat(60)])

    expect(description.length).toBeLessThanOrEqual(160)
    expect(description).toMatch(/word\.\.\.$/)
  })
})

describe('category pagination helpers', () => {
  it('slices pages, builds page routes, and lists only pages after the first', async () => {
    await withSite('serpdownloaders.com')
    const {
      generateCategoryPaginationStaticParams,
      getCategoryPageRoute,
      parseCategoryPageParam,
      sliceCategoryPage
    } = await import('./category-pagination')
    const items = Array.from({ length: 7 }, (_, index) => index)

    expect(sliceCategoryPage(items, 1, undefined)).toMatchObject({ items, pageCount: 1 })
    expect(sliceCategoryPage(items, 2, 3)).toEqual({
      items: [3, 4, 5],
      page: 2,
      pageCount: 3,
      startIndex: 3,
      totalCount: 7
    })
    expect(sliceCategoryPage(items, 4, 3)).toBeUndefined()
    expect(getCategoryPageRoute('adult', 1)).toBe('/categories/adult/')
    expect(getCategoryPageRoute('adult', 3)).toBe('/categories/adult/page/3/')
    expect(parseCategoryPageParam('2')).toBe(2)
    expect(parseCategoryPageParam('1')).toBeUndefined()
    expect(parseCategoryPageParam('02')).toBeUndefined()
    expect(parseCategoryPageParam('x')).toBeUndefined()

    const categories = [
      { slug: 'adult' },
      { slug: 'video-downloaders' }
    ] as unknown as Category[]
    const listings = [
      ...Array.from({ length: 5 }, (_, index) => listing(`a-${index}`, ['adult'])),
      listing('v-1', ['video-downloaders'])
    ]

    expect(generateCategoryPaginationStaticParams(categories, listings, 2)).toEqual([
      { category: 'adult', page: '2' },
      { category: 'adult', page: '3' }
    ])
    expect(generateCategoryPaginationStaticParams(categories, listings, undefined)).toEqual([])
  })

  it('shows a compact pager for many pages', async () => {
    await withSite('serpdownloaders.com')
    const { getVisibleCategoryPages } = await import('./category-routes/category-pagination-nav')

    expect(getVisibleCategoryPages(1, 3)).toEqual([1, 2, 3])
    expect(getVisibleCategoryPages(5, 10)).toEqual([1, 'gap', 4, 5, 6, 'gap', 10])
  })
})

function collectJsonLd(node: ReactNode, JsonLd: unknown): Record<string, unknown>[] {
  if (Array.isArray(node)) {
    return node.flatMap(child => collectJsonLd(child, JsonLd))
  }

  if (!isValidElement(node)) {
    return []
  }

  const props = node.props as { children?: ReactNode; data?: Record<string, unknown> }

  return node.type === JsonLd && props.data ? [props.data] : collectJsonLd(props.children, JsonLd)
}

describe('paginated category route page', () => {
  const category: Category = {
    description: 'Adult downloaders.',
    icon: Package,
    name: 'Adult',
    priority: 'medium',
    slug: 'adult'
  }
  const allProjects = Array.from({ length: 5 }, (_, index) =>
    listing(`adult-${index}`, ['adult'], `Adult ${index}`)
  )

  async function renderPage(page: number, categoryPageSize?: number) {
    await withSite('serpdownloaders.com', config => ({
      ...config,
      browse: { ...config.browse, categoryPageSize }
    }))
    const { CategoryRoutePage, generateCategoryRouteMetadata } = await import(
      './category-routes/category-page'
    )
    const JsonLd = (_props: { data: Record<string, unknown> }) => null
    const Null = () => null
    const route = CategoryRoutePage({
      activeCategorySlugs: ['adult'],
      allProjects,
      category,
      featuredGuides: [],
      featuredProjects: [],
      page,
      slots: {
        CategoryWebsitesList: Null,
        ExternalResourcesSection: Null,
        FeaturedGuidesSection: Null,
        JsonLd,
        breadcrumb: null
      }
    })
    const metadata = await generateCategoryRouteMetadata({ allProjects, category, page })

    return { metadata, route, schema: collectJsonLd(route.element, JsonLd)[0] }
  }

  it('renders one page of listings with a self-canonical URL and continuing positions', async () => {
    const { metadata, route, schema } = await renderPage(2, 2)
    const mainEntity = schema?.mainEntity as {
      itemListElement: Array<{ position: number; url: string }>
      numberOfItems: number
    }

    expect(route.categoryProjects.map(project => project.slug)).toEqual(['adult-2', 'adult-3'])
    expect(schema?.url).toBe('https://serpdownloaders.com/categories/adult/page/2/')
    expect(mainEntity.numberOfItems).toBe(5)
    expect(mainEntity.itemListElement.map(item => item.position)).toEqual([3, 4])
    expect(metadata.alternates?.canonical).toBe(
      'https://serpdownloaders.com/categories/adult/page/2/'
    )
    expect(String(metadata.title)).toMatch(/ - Page 2$/)
    expect(String(metadata.description)).toMatch(/^Page 2 of 3\./)
  })

  it('returns no listings for a page past the end', async () => {
    const { route } = await renderPage(4, 2)

    expect(route.categoryProjects).toEqual([])
  })

  it('keeps every listing on one page when no page size is configured', async () => {
    const { metadata, route } = await renderPage(1)

    expect(route.categoryProjects).toHaveLength(5)
    expect(metadata.alternates?.canonical).toBe('https://serpdownloaders.com/categories/adult/')
  })
})

describe('homepage category sections', () => {
  it('groups listings by canonical category in categories.json order without repeats', async () => {
    await withSite('serpdownloaders.com')
    const { buildHomepageCategorySections } = await import('./homepage-category-sections')
    const sections = buildHomepageCategorySections(
      [
        listing('b-video', ['video-downloaders'], 'B Video'),
        listing('a-video', ['video-downloaders', 'adult'], 'A Video'),
        listing('c-adult', ['adult'], 'C Adult'),
        listing('d-adult', ['adult'], 'D Adult')
      ],
      { limit: 1, siteId: 'serpdownloaders.com' }
    )

    const { resolveCheckedInSiteCategories } = await import(
      '@thedaviddias/site-contract/categories'
    )
    const configuredOrder = resolveCheckedInSiteCategories('serpdownloaders.com')
      .map(category => category.slug)
      .filter(slug => slug === 'adult' || slug === 'video-downloaders')
    const sectionsBySlug = Object.fromEntries(
      sections.map(section => [section.category.slug, section])
    )

    expect(sections.map(section => section.category.slug)).toEqual(configuredOrder)
    expect(sectionsBySlug['video-downloaders']?.listings.map(item => item.slug)).toEqual([
      'a-video'
    ])
    expect(sectionsBySlug.adult?.listings.map(item => item.slug)).toEqual(['c-adult'])
    expect(sectionsBySlug.adult?.totalCount).toBe(3)
    expect(sectionsBySlug.adult?.href).toBe('/categories/adult/')
  })
})

describe('homepage and brands copy overrides', () => {
  it('keep the starter copy when no override is configured', async () => {
    await withSite('serpdownloaders.com')
    const { homePageMetadata } = await import('./home-page')

    expect(homePageMetadata.title).toBe('SERP Downloaders Directory of Products and Resources')
    expect(homePageMetadata.description).toBe(
      'For the people who just like to get down...loading. Browse curated products, resources, and documentation links in one searchable directory.'
    )
  })

  it('use copy.homepage and copy.brandsDescription when configured', async () => {
    await withSite('serpdownloaders.com', config => ({
      ...config,
      copy: {
        ...config.copy,
        brandsDescription: 'Every SERP brand in one place.',
        homepage: { description: 'Custom description.', title: 'Custom Title' }
      }
    }))
    const { homePageMetadata } = await import('./home-page')
    const { generateMetadata } = await import('./static-pages/brands-page')

    expect(homePageMetadata.title).toBe('Custom Title')
    expect(homePageMetadata.description).toBe('Custom description.')
    expect(generateMetadata().description).toBe('Every SERP brand in one place.')
  })
})
