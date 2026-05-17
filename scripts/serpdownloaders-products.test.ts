import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

type SerpdownloadersProductEntry = {
  content?: {
    body?: string
    faq?: Array<{
      answer?: string
      question?: string
    }>
  }
  relatedLinks?: Array<{
    label?: string
    url?: string
  }>
  product?: {
    productPage?: string
    slug?: string
    tagline?: string
    title?: string
  }
}

type ToolsProductEntry = {
  content?: {
    productLinks?: {
      appsUrl?: string
      githubRepoUrl?: string
      serplyUrl?: string
    }
    sourceLinks?: Array<{
      label?: string
      url?: string
    }>
  }
}

const productsPath = resolve(process.cwd(), 'sites/serpdownloaders.com/products.json')
const serpSoftwareProductsPath = resolve(process.cwd(), 'sites/serp.software/products.json')
const toolsProductsPath = resolve(
  '/Users/devin/dev/repos/tools.serp.co/packages/app-core/src/data/tools.json'
)

const missing404ProductSlugs = [
  'getty-images-downloader',
  'unsplash-downloader',
  'wistia-video-downloader',
  'adobe-stock-downloader',
  'soundgasm-downloader',
  'vectorstock-downloader',
  'coursera-downloader',
  'deviantart-downloader',
  'hulu-downloader',
  'internet-archive-downloader',
  'livejasmin-downloader',
  'moodle-downloader',
  'netflix-downloader',
  'patreon-downloader',
  'pexels-video-downloader',
  'rawpixel-downloader',
  'redtube-video-downloader',
  'terabox-downloader',
  'thumbnail-downloader',
  'xnxx-video-downloader',
  'alamy-downloader',
  'nicovideo-downloader',
  'podia-downloader',
  'skillshare-downloader',
  'skool-video-downloader',
  'snapchat-video-downloader',
  'teachable-video-downloader'
] as const

function cleanLabel(label?: string): string | undefined {
  if (label === 'Install extension') {
    return 'Install browser extension'
  }
  if (label === 'GitHub') {
    return 'GitHub repository'
  }
  return label
}

function expectCleanRelatedLinks(slug: string, links: SerpdownloadersProductEntry['relatedLinks']) {
  const seenUrls = new Set<string>()
  const seenLabels = new Set<string>()

  for (const link of links ?? []) {
    const label = link.label ?? ''
    const url = link.url ?? ''
    const normalizedUrl = url.replace(/\/+$/, '')

    expect(label, `${slug} link label`).not.toMatch(/^https?:\/\//)
    expect(url, `${slug} link url`).not.toBe('https://github.com/serpapps')
    expect(url, `${slug} link url`).not.toBe('https://github.com/serpapps/le')
    expect(url, `${slug} link url`).not.toContain('apps.serp.co/products/')
    expect(`${label} ${url}`, `${slug} link`).not.toMatch(/libhunt/i)
    expect(
      label === 'SERP Apps' && url.startsWith('https://serp.ly/'),
      `${slug} serp.ly label`
    ).toBe(false)
    expect(seenUrls.has(normalizedUrl), `${slug} duplicate related link ${url}`).toBe(false)
    seenUrls.add(normalizedUrl)
    expect(seenLabels.has(label), `${slug} duplicate related label ${label}`).toBe(false)
    seenLabels.add(label)
  }
}

function canonicalUrl(url?: string): string | undefined {
  if (!url) {
    return undefined
  }

  const trimmed = url.trim()
  if (
    /^https:\/\/(?:serp\.co|serp\.ai)\/products\/[^/]+\/reviews\/?$/.test(trimmed) ||
    /^https:\/\/(?:browserextensions\.io\/products|extensions\.serp\.co\/extensions\/serp)\/[^/]+\/?$/.test(
      trimmed
    )
  ) {
    return `${trimmed.replace(/\/+$/, '')}/`
  }

  return trimmed
}

function findToolsProductBySerply(serplyUrl: string): ToolsProductEntry | undefined {
  const toolsProducts = JSON.parse(readFileSync(toolsProductsPath, 'utf8')) as ToolsProductEntry[]
  return toolsProducts.find(entry => entry.content?.productLinks?.serplyUrl === serplyUrl)
}

describe('serpdownloaders checked-in products', () => {
  it('includes the downloader listings currently missing from live 404 traffic', () => {
    const products = JSON.parse(readFileSync(productsPath, 'utf8')) as Record<
      string,
      SerpdownloadersProductEntry
    >

    expect(Object.keys(products)).toHaveLength(105)

    for (const slug of missing404ProductSlugs) {
      expect(products[slug]).toBeDefined()
      expect(products[slug]?.product).toMatchObject({
        productPage: expect.stringMatching(/^https:\/\/serp\.ly\/.+/),
        slug,
        tagline: expect.any(String),
        title: expect.any(String)
      })
      expect(products[slug]?.content?.body).toContain('## Overview')
      expect(products[slug]?.content?.body).toContain('## Key Features')
      expect(products[slug]?.content?.faq?.length).toBeGreaterThanOrEqual(3)
      expect(products[slug]?.relatedLinks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            label: 'SERP Apps',
            url: expect.stringMatching(/^https:\/\/apps\.serp\.co\/[^/]+$/)
          })
        ])
      )
    }
  })

  it('uses clean product-specific resource links without generic GitHub fallbacks', () => {
    const products = JSON.parse(readFileSync(productsPath, 'utf8')) as Record<
      string,
      SerpdownloadersProductEntry
    >

    for (const [slug, product] of Object.entries(products)) {
      expect(product.product?.productPage, slug).toMatch(/^https:\/\/serp\.ly\/.+/)
      expect(product.content?.body ?? '', slug).not.toContain('https://apps.serp.co/')

      expectCleanRelatedLinks(slug, product.relatedLinks)
    }
  })

  it('uses source-backed tools.serp.co links for overlapping downloader records', () => {
    const products = JSON.parse(readFileSync(productsPath, 'utf8')) as Record<
      string,
      SerpdownloadersProductEntry
    >

    let checkedOverlappingProducts = 0

    for (const [slug, product] of Object.entries(products)) {
      const toolsProduct = findToolsProductBySerply(product.product?.productPage ?? '')
      if (!toolsProduct) {
        continue
      }

      checkedOverlappingProducts += 1
      const relatedLinks = product.relatedLinks ?? []
      const relatedByLabel = new Map<string | undefined, string | undefined>()
      for (const link of relatedLinks) {
        if (!relatedByLabel.has(link.label)) {
          relatedByLabel.set(link.label, link.url)
        }
      }
      const sourceLinks = toolsProduct.content?.sourceLinks ?? []
      const allowedSourceUrls = new Set(
        [
          toolsProduct.content?.productLinks?.serplyUrl,
          toolsProduct.content?.productLinks?.appsUrl,
          toolsProduct.content?.productLinks?.githubRepoUrl?.endsWith('/le')
            ? undefined
            : toolsProduct.content?.productLinks?.githubRepoUrl,
          ...sourceLinks
            .filter(link => link.url !== 'https://github.com/serpapps/le')
            .map(link => link.url)
        ]
          .map(canonicalUrl)
          .filter(Boolean)
      )

      for (const label of [
        'Install browser extension',
        'SERP Apps',
        'GitHub repository',
        'SERP Extensions',
        'SERP',
        'SERP AI',
        'Browser Extensions'
      ] as const) {
        expect(relatedByLabel.get(label), `${slug} missing ${label}`).toBeDefined()
      }

      expect(relatedByLabel.get('SERP Apps'), slug).toBe(
        toolsProduct.content?.productLinks?.appsUrl
      )
      expect(relatedByLabel.get('Install browser extension'), slug).toBe(
        toolsProduct.content?.productLinks?.serplyUrl
      )
      expect(relatedByLabel.get('SERP'), slug).toMatch(/\/products\/.+\/reviews\/$/)
      expect(relatedByLabel.get('SERP AI'), slug).toMatch(/\/products\/.+\/reviews\/$/)
      expect(relatedByLabel.get('Browser Extensions'), slug).toMatch(/\/products\/.+\/$/)

      for (const link of relatedLinks.filter(link => cleanLabel(link.label) === link.label)) {
        if (
          [
            'Chrome Web Store',
            'Firefox Add-ons',
            'Firefox Store',
            'GitHub Releases',
            'Gist',
            'Help Center',
            'Latest Release',
            'Open Collective',
            'Product Hunt',
            'Reddit'
          ].includes(link.label ?? '')
        ) {
          continue
        }
        expect(
          allowedSourceUrls.has(canonicalUrl(link.url)),
          `${slug} ${link.label} ${link.url} must be tools-backed`
        ).toBe(true)
      }
    }

    expect(checkedOverlappingProducts).toBeGreaterThan(70)
  })
})

describe('serp.software checked-in products', () => {
  it('copies the full live downloader catalog from serpdownloaders.com', () => {
    const serpdownloadersProducts = JSON.parse(readFileSync(productsPath, 'utf8')) as Record<
      string,
      SerpdownloadersProductEntry
    >
    const serpSoftwareProducts = JSON.parse(
      readFileSync(serpSoftwareProductsPath, 'utf8')
    ) as Record<string, SerpdownloadersProductEntry>

    expect(Object.keys(serpSoftwareProducts)).toHaveLength(105)
    expect(serpSoftwareProducts).toEqual(serpdownloadersProducts)
  })

  it('has wrapper-public files for copied root-relative listing logos', () => {
    const serpSoftwareProducts = JSON.parse(
      readFileSync(serpSoftwareProductsPath, 'utf8')
    ) as Record<
      string,
      SerpdownloadersProductEntry & {
        media?: {
          logo?: string
        }
      }
    >

    for (const [slug, product] of Object.entries(serpSoftwareProducts)) {
      const logoPath = product.media?.logo

      if (!logoPath?.startsWith('/listing-logos/')) {
        continue
      }

      expect(
        existsSync(resolve(process.cwd(), 'apps/serp.software/public', logoPath.slice(1))),
        `${slug} logo ${logoPath} must exist in the serp.software wrapper`
      ).toBe(true)
    }
  })
})
