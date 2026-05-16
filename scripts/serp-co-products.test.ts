import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

type ProductEntry = {
  content?: {
    body?: string
  }
  media?: {
    logo?: string
  }
  product?: {
    productPage?: string
    slug?: string
    tagline?: string
    title?: string
  }
}

const serpCoProductsPath = resolve(process.cwd(), 'sites/serp.co/products.json')
const downloaderProductsPath = resolve(
  process.cwd(),
  'sites/serpdownloaders.com/products.json'
)

describe('serp.co checked-in products', () => {
  it('contains every canonical serpdownloaders listing', () => {
    const serpCoProducts = JSON.parse(readFileSync(serpCoProductsPath, 'utf8')) as Record<
      string,
      ProductEntry
    >
    const downloaderProducts = JSON.parse(
      readFileSync(downloaderProductsPath, 'utf8')
    ) as Record<string, ProductEntry>

    for (const [slug, downloaderProduct] of Object.entries(downloaderProducts)) {
      expect(serpCoProducts[slug], `serp.co must include ${slug}`).toBeDefined()
      expect(serpCoProducts[slug]?.product).toMatchObject({
        productPage: downloaderProduct.product?.productPage,
        slug,
        tagline: downloaderProduct.product?.tagline,
        title: downloaderProduct.product?.title
      })
      expect(serpCoProducts[slug]?.content?.body).toContain('## Overview')
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
    const featuredListings = listings.filter((listing) => listing.featured === true)

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
