import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

type ProductEntry = {
  content?: {
    body?: string
    faq?: Array<{
      answer?: string
      question?: string
    }>
  }
  media?: {
    logo?: string
  }
  product?: {
    categories?: string[]
    productPage?: string
    slug?: string
    tagline?: string
    title?: string
  }
  relatedLinks?: Array<{
    label?: string
    url?: string
  }>
}

const serpCoProductsPath = resolve(process.cwd(), 'sites/serp.co/products.json')
const downloaderProductsPath = resolve(process.cwd(), 'sites/serpdownloaders.com/products.json')

describe('serp.co checked-in products', () => {
  it('contains every canonical serpdownloaders listing', () => {
    const serpCoProducts = JSON.parse(readFileSync(serpCoProductsPath, 'utf8')) as Record<
      string,
      ProductEntry
    >
    const downloaderProducts = JSON.parse(readFileSync(downloaderProductsPath, 'utf8')) as Record<
      string,
      ProductEntry
    >

    expect(Object.keys(serpCoProducts)).toHaveLength(3422)

    for (const [slug, downloaderProduct] of Object.entries(downloaderProducts)) {
      if (!downloaderProduct.product?.productPage?.startsWith('https://serp.ly/')) {
        continue
      }

      expect(serpCoProducts[slug], `serp.co must include ${slug}`).toBeDefined()
      expect(serpCoProducts[slug]?.product).toMatchObject({
        productPage: downloaderProduct.product?.productPage,
        slug,
        title: downloaderProduct.product?.title
      })
      expect(serpCoProducts[slug]?.content?.body).toContain('## Overview')
      expect(serpCoProducts[slug]?.content?.faq?.length).toBeGreaterThanOrEqual(3)
    }
  })

  it('keeps the serp.ai listing about SERP AI instead of the legacy Bark import', () => {
    const serpCoProducts = JSON.parse(readFileSync(serpCoProductsPath, 'utf8')) as Record<
      string,
      ProductEntry
    >

    expect(serpCoProducts['serp.ai']?.product).toMatchObject({
      categories: ['ai-directories'],
      productPage: 'https://serp.ai',
      slug: 'serp.ai',
      tagline: 'AI tools, companies, models, datasets, news, and resources',
      title: 'SERP AI'
    })
    expect(serpCoProducts['serp.ai']?.content?.body).toContain('SERP AI is a directory')
    expect(serpCoProducts['serp.ai']?.content?.body).not.toMatch(/Bark/i)
  })

  it('keeps downloader CTAs and resource links product-specific', () => {
    const serpCoProducts = JSON.parse(readFileSync(serpCoProductsPath, 'utf8')) as Record<
      string,
      ProductEntry
    >
    const downloaderProducts = JSON.parse(readFileSync(downloaderProductsPath, 'utf8')) as Record<
      string,
      ProductEntry
    >

    for (const [slug, downloaderProduct] of Object.entries(downloaderProducts)) {
      if (!downloaderProduct.product?.productPage?.startsWith('https://serp.ly/')) {
        continue
      }

      const product = serpCoProducts[slug]

      expect(product?.product?.productPage, slug).toMatch(/^https:\/\/serp\.ly\/.+/)
      expect(product?.content?.body ?? '', slug).not.toContain('https://apps.serp.co/')

      for (const link of product?.relatedLinks ?? []) {
        expect(link.label, `${slug} link label`).not.toMatch(/^https?:\/\//)
        expect(link.url, `${slug} link url`).not.toBe('https://github.com/serpapps')
        expect(link.url, `${slug} link url`).not.toBe('https://github.com/serpapps/le')
        expect(link.url, `${slug} link url`).not.toContain('apps.serp.co/products/')
        expect(`${link.label} ${link.url}`, `${slug} related link`).not.toMatch(/libhunt/i)
        expect(
          link.label === 'SERP Apps' && link.url?.startsWith('https://serp.ly/'),
          `${slug} serp.ly must not be labeled SERP Apps`
        ).toBe(false)
      }

      const relatedUrls = new Set<string>()
      const relatedLabels = new Set<string>()
      for (const link of product?.relatedLinks ?? []) {
        const normalizedUrl = link.url?.replace(/\/+$/, '')
        expect(
          relatedUrls.has(normalizedUrl ?? ''),
          `${slug} duplicate related link ${link.url}`
        ).toBe(false)
        if (normalizedUrl) {
          relatedUrls.add(normalizedUrl)
        }
        expect(
          relatedLabels.has(link.label ?? ''),
          `${slug} duplicate related label ${link.label}`
        ).toBe(false)
        if (link.label) {
          relatedLabels.add(link.label)
        }
      }
    }
  })

  it('keeps source-backed downloader review links on canonical review routes', () => {
    const serpCoProducts = JSON.parse(readFileSync(serpCoProductsPath, 'utf8')) as Record<
      string,
      ProductEntry
    >

    for (const slug of [
      '123movies-downloader',
      'alphaporno-downloader',
      'twitter-x-downloader'
    ] as const) {
      const relatedLinks = serpCoProducts[slug]?.relatedLinks ?? []

      expect(relatedLinks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            label: 'SERP',
            url: expect.stringMatching(/^https:\/\/serp\.co\/products\/.+\/reviews\/$/)
          }),
          expect.objectContaining({
            label: 'SERP AI',
            url: expect.stringMatching(/^https:\/\/serp\.ai\/products\/.+\/reviews\/$/)
          }),
          expect.objectContaining({
            label: 'Browser Extensions',
            url: expect.stringMatching(/^https:\/\/browserextensions\.io\/products\/.+\/$/)
          })
        ])
      )
    }
  })

  it('has wrapper-public files for root-relative downloader logos', () => {
    const serpCoProducts = JSON.parse(readFileSync(serpCoProductsPath, 'utf8')) as Record<
      string,
      ProductEntry
    >

    for (const [slug, product] of Object.entries(serpCoProducts)) {
      const logoPath = product.media?.logo

      if (!logoPath?.startsWith('/listing-logos/serpdownloaders.com/')) {
        continue
      }

      expect(
        existsSync(resolve(process.cwd(), 'apps/serp.co/public', logoPath.slice(1))),
        `${slug} logo ${logoPath} must exist in the serp.co wrapper`
      ).toBe(true)
    }
  })

  it('only marks downloader listings as featured after site data is prepared', () => {
    const listings = JSON.parse(
      readFileSync(resolve(process.cwd(), 'data/listings.json'), 'utf8')
    ) as Array<{
      categories?: string[]
      category?: string
      featured?: boolean
      slug: string
    }>
    const featuredListings = listings.filter(listing => listing.featured === true)

    expect(featuredListings.length).toBeGreaterThan(0)

    for (const listing of featuredListings) {
      expect(
        listing.categories?.includes('video-downloaders') ||
          listing.category === 'video-downloaders',
        `${listing.slug} is featured but is not a downloader`
      ).toBe(true)
    }
  })
})
