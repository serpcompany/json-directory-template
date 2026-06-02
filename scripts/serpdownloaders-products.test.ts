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
  media?: {
    images?: string[]
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
const serpdownloadersPublicPath = resolve(process.cwd(), 'apps/serpdownloaders.com/public')
const serpSoftwarePublicPath = resolve(process.cwd(), 'apps/serp.software/public')
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

const pagesDevWebsiteSubmissionSlugs = [
  'coomervideodownloader.pages.dev',
  'doodstreamvideodownloader.pages.dev',
  'hdzogvideodownloader.pages.dev',
  'hotmovsvideodownloader.pages.dev',
  'javvideodownloader.pages.dev',
  'luxuretvvideodownloader.pages.dev',
  'manyvidsvideodownloader.pages.dev',
  'onlyfansvideodownloader.pages.dev',
  'pornhatvideodownloader.pages.dev',
  'pornhubvideodownloader.pages.dev',
  'pornonevideodownloader.pages.dev',
  'stripchatvideodownloader.pages.dev',
  'txxxvideodownloader.pages.dev',
  'uporniavideodownloader.pages.dev',
  'whopvideodownloader.pages.dev',
  'xfantazyvideodownloader.pages.dev',
  'xfreehdvideodownloader.pages.dev',
  'xgroovyvideodownloader.pages.dev',
  'youpornvideodownloader.pages.dev'
] as const

const expectedSerpdownloadersProductCount = 319 + pagesDevWebsiteSubmissionSlugs.length

const pagesDevExpectedTitles: Record<(typeof pagesDevWebsiteSubmissionSlugs)[number], string> = {
  'coomervideodownloader.pages.dev': 'Coomer Video Downloader',
  'doodstreamvideodownloader.pages.dev': 'DoodStream Video Downloader',
  'hdzogvideodownloader.pages.dev': 'HDZog Video Downloader',
  'hotmovsvideodownloader.pages.dev': 'HotMovs Video Downloader',
  'javvideodownloader.pages.dev': 'JAV Video Downloader',
  'luxuretvvideodownloader.pages.dev': 'LuxureTV Video Downloader',
  'manyvidsvideodownloader.pages.dev': 'ManyVids Video Downloader',
  'onlyfansvideodownloader.pages.dev': 'OnlyFans Video Downloader',
  'pornhatvideodownloader.pages.dev': 'PornHat Video Downloader',
  'pornhubvideodownloader.pages.dev': 'Pornhub Video Downloader',
  'pornonevideodownloader.pages.dev': 'PornOne Video Downloader',
  'stripchatvideodownloader.pages.dev': 'Stripchat Video Downloader',
  'txxxvideodownloader.pages.dev': 'TXXX Video Downloader',
  'uporniavideodownloader.pages.dev': 'Upornia Video Downloader',
  'whopvideodownloader.pages.dev': 'Whop Video Downloader',
  'xfantazyvideodownloader.pages.dev': 'XFantazy Video Downloader',
  'xfreehdvideodownloader.pages.dev': 'XFreeHD Video Downloader',
  'xgroovyvideodownloader.pages.dev': 'XGroovy Video Downloader',
  'youpornvideodownloader.pages.dev': 'YouPorn Video Downloader'
}

function isPagesDevWebsiteSubmission(slug: string): boolean {
  return (pagesDevWebsiteSubmissionSlugs as readonly string[]).includes(slug)
}

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

    expect(Object.keys(products)).toHaveLength(expectedSerpdownloadersProductCount)

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
      if (isPagesDevWebsiteSubmission(slug)) {
        expect(product.product?.productPage, slug).toBe(`https://${slug}`)
        expect(product.content?.body ?? '', slug).toContain('## How It Works')
        expect(product.content?.body ?? '', slug).toContain('## What It Does')
        expect(product.content?.faq?.length ?? 0, slug).toBeGreaterThanOrEqual(5)
      } else {
        expect(product.product?.productPage, slug).toMatch(/^https:\/\/serp\.ly\/.+/)
      }
      expect(product.content?.body ?? '', slug).not.toContain('https://apps.serp.co/')

      expectCleanRelatedLinks(slug, product.relatedLinks)
    }
  })

  it('uses homepage screenshots as main images for submitted pages.dev websites', () => {
    const products = JSON.parse(readFileSync(productsPath, 'utf8')) as Record<
      string,
      SerpdownloadersProductEntry
    >

    for (const slug of pagesDevWebsiteSubmissionSlugs) {
      const expectedImagePath = `/media/products/${slug}/homepage.png`
      const product = products[slug]

      expect(product?.media?.images?.[0], `${slug} main image`).toBe(expectedImagePath)
      expect(
        existsSync(resolve(serpdownloadersPublicPath, expectedImagePath.slice(1))),
        `${slug} homepage screenshot must exist in serpdownloaders.com public files`
      ).toBe(true)
      expect(
        existsSync(resolve(serpSoftwarePublicPath, expectedImagePath.slice(1))),
        `${slug} homepage screenshot must exist in serp.software public files`
      ).toBe(true)
    }
  })

  it('uses concise product names for submitted pages.dev website H1s', () => {
    const products = JSON.parse(readFileSync(productsPath, 'utf8')) as Record<
      string,
      SerpdownloadersProductEntry
    >

    for (const slug of pagesDevWebsiteSubmissionSlugs) {
      expect(products[slug]?.product?.title, `${slug} product title`).toBe(
        pagesDevExpectedTitles[slug]
      )
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

      const relatedLinks = product.relatedLinks ?? []
      if (relatedLinks.some(link => link.label === 'SERPX')) {
        continue
      }

      checkedOverlappingProducts += 1
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

  it('uses README-backed resource links for imported downloader sheet records', () => {
    const products = JSON.parse(readFileSync(productsPath, 'utf8')) as Record<
      string,
      SerpdownloadersProductEntry
    >

    for (const slug of ['321tube-downloader', '4k69-downloader', 'zbporn-downloader'] as const) {
      const product = products[slug]
      const relatedLinks = product?.relatedLinks ?? []

      expect(product?.product?.productPage, slug).toBe(`https://serp.ly/${slug}`)
      expect(product?.content?.body, slug).toContain('## Why')
      expect(product?.content?.faq?.length, slug).toBeGreaterThanOrEqual(3)
      expect(JSON.stringify(relatedLinks), slug).not.toContain('help.serp.co/en')
      expect(relatedLinks, slug).toEqual(
        expect.arrayContaining([
          { label: 'SERPX', url: `https://serpx.link/${slug}` },
          { label: 'Latest Release', url: `https://github.com/serpapps/${slug}/releases/latest` },
          { label: 'GitHub Issues', url: `https://github.com/serpapps/${slug}/issues` }
        ])
      )
    }
  })
})

describe('serp.software checked-in products', () => {
  it('keeps the full downloader catalog while rewriting submitted pages.dev copy', () => {
    const serpdownloadersProducts = JSON.parse(readFileSync(productsPath, 'utf8')) as Record<
      string,
      SerpdownloadersProductEntry
    >
    const serpSoftwareProducts = JSON.parse(
      readFileSync(serpSoftwareProductsPath, 'utf8')
    ) as Record<string, SerpdownloadersProductEntry>

    expect(Object.keys(serpSoftwareProducts)).toHaveLength(expectedSerpdownloadersProductCount)
    expect(Object.keys(serpSoftwareProducts).sort()).toEqual(
      Object.keys(serpdownloadersProducts).sort()
    )

    for (const [slug, product] of Object.entries(serpdownloadersProducts)) {
      if (!isPagesDevWebsiteSubmission(slug)) {
        expect(serpSoftwareProducts[slug], `${slug} non-pages.dev product`).toEqual(product)
      }
    }

    for (const slug of pagesDevWebsiteSubmissionSlugs) {
      const expectedImagePath = `/media/products/${slug}/homepage.png`
      const serpdownloadersProduct = serpdownloadersProducts[slug]
      const serpSoftwareProduct = serpSoftwareProducts[slug]

      expect(serpSoftwareProduct?.product).toMatchObject({
        productPage: `https://${slug}`,
        slug,
        title: pagesDevExpectedTitles[slug]
      })
      expect(serpSoftwareProduct?.media?.images?.[0], `${slug} main image`).toBe(expectedImagePath)
      expect(
        existsSync(resolve(serpSoftwarePublicPath, expectedImagePath.slice(1))),
        `${slug} homepage screenshot must exist in the serp.software wrapper`
      ).toBe(true)
      expect(serpSoftwareProduct?.product?.tagline, `${slug} tagline`).not.toBe(
        serpdownloadersProduct?.product?.tagline
      )
      expect(serpSoftwareProduct?.content?.body, `${slug} body`).not.toBe(
        serpdownloadersProduct?.content?.body
      )
      expect(JSON.stringify(serpSoftwareProduct?.content?.faq ?? []), `${slug} faq`).not.toBe(
        JSON.stringify(serpdownloadersProduct?.content?.faq ?? [])
      )
    }
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
