import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import {
  collectLegacyListingRedirects,
  getLegacyListingSlugFormatError
} from '@thedaviddias/site-contract/legacy-listing-slugs'
import {
  canonicalizeTrialProducts,
  normalizeTrialProduct
} from '@thedaviddias/site-contract/trial-products'
import { afterEach, describe, expect, it } from 'vitest'
import {
  applyLegacyListingRedirects,
  applyLegacyRootListingRedirects,
  buildStaticRedirectHtml
} from './build-site.ts'
import { getReservedRootRouteSegments } from './legacy-listing-redirects.ts'
import { loadCheckedInSite } from './site-config.ts'
import { writeSplitSitemaps } from './sitemap-files.ts'

const tempDirs: string[] = []

function makeTempArtifactDir(): string {
  mkdirSync(resolve(process.cwd(), 'tmp'), { recursive: true })
  const dir = mkdtempSync(resolve(process.cwd(), 'tmp/legacy-listing-redirects-'))
  tempDirs.push(dir)
  return dir
}

function writeFile(path: string, contents: string): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, contents)
}

function listingPageHtml(canonicalUrl: string): string {
  return `<!doctype html><html><head><link rel="canonical" href="${canonicalUrl}"/></head><body>listing</body></html>`
}

afterEach(() => {
  tempDirs.splice(0).forEach(dir => {
    rmSync(dir, { force: true, recursive: true })
  })
})

describe('collectLegacyListingRedirects', () => {
  it('returns one redirect per legacy slug, including dotted slugs', () => {
    expect(
      collectLegacyListingRedirects([
        {
          legacySlugs: ['hotmovsvideodownloader.pages.dev', 'hotmovs-video-downloader'],
          slug: 'hotmovs-downloader'
        },
        { slug: 'redtube-video-downloader', legacySlugs: ['redtube-downloader'] },
        { slug: 'other-downloader' }
      ])
    ).toEqual([
      { legacySlug: 'hotmovs-video-downloader', slug: 'hotmovs-downloader' },
      { legacySlug: 'hotmovsvideodownloader.pages.dev', slug: 'hotmovs-downloader' },
      { legacySlug: 'redtube-downloader', slug: 'redtube-video-downloader' }
    ])
  })

  it('rejects a legacy slug that is still a live listing slug or root alias', () => {
    expect(() =>
      collectLegacyListingRedirects([
        { legacySlugs: ['redtube-downloader'], slug: 'redtube-video-downloader' },
        { slug: 'redtube-downloader' }
      ])
    ).toThrow(/"redtube-downloader" is still a live listing slug \(and root alias\)/)
  })

  it('rejects a legacy slug equal to its own live slug', () => {
    expect(() =>
      collectLegacyListingRedirects([{ legacySlugs: ['a-downloader'], slug: 'a-downloader' }])
    ).toThrow(/still a live listing slug/)
  })

  it('rejects a legacy slug claimed by two records', () => {
    expect(() =>
      collectLegacyListingRedirects([
        { legacySlugs: ['old-downloader'], slug: 'a-downloader' },
        { legacySlugs: ['old-downloader'], slug: 'b-downloader' }
      ])
    ).toThrow(/"old-downloader" is already claimed by a-downloader/)
  })

  it('rejects a legacy slug listed twice on one record', () => {
    expect(() =>
      collectLegacyListingRedirects([
        { legacySlugs: ['old-downloader', 'old-downloader'], slug: 'a-downloader' }
      ])
    ).toThrow(/"old-downloader" is listed more than once/)
  })

  it.each([
    'Old-Downloader',
    'old downloader',
    'old/downloader',
    '-old',
    'old..downloader',
    'old-downloader.',
    '',
    'logo.png',
    'feed.xml'
  ])('rejects the malformed legacy slug %j', legacySlug => {
    expect(getLegacyListingSlugFormatError(legacySlug)).toBeDefined()
    expect(() =>
      collectLegacyListingRedirects([{ legacySlugs: [legacySlug], slug: 'a-downloader' }])
    ).toThrow(/Invalid product\.legacySlugs/)
  })

  it.each(['categories', 'brands', 'legal', 'search', 'posts', 'products', 'docs'])(
    'rejects a legacy slug that collides with the reserved root route /%s/',
    reserved => {
      expect(() =>
        collectLegacyListingRedirects([{ legacySlugs: [reserved], slug: 'a-downloader' }], {
          reservedRootSegments: [
            '/categories',
            'brands/',
            '/legal/dmca',
            'search',
            'posts',
            'products',
            'docs'
          ]
        })
      ).toThrow(new RegExp(`collides with the reserved top-level route "/${reserved}/"`))
    }
  )

  it('reports every problem at once', () => {
    expect(() =>
      collectLegacyListingRedirects(
        [
          { legacySlugs: ['Bad Slug', 'brands', 'b-downloader'], slug: 'a-downloader' },
          { slug: 'b-downloader' }
        ],
        { reservedRootSegments: ['brands'] }
      )
    ).toThrow(/Bad Slug[\s\S]*brands[\s\S]*b-downloader/)
  })
})

describe('trial product legacySlugs normalization', () => {
  it('keeps product.legacySlugs through normalization and canonicalization', () => {
    const product = {
      product: {
        legacySlugs: [' hotmovsvideodownloader.pages.dev '],
        productPage: 'https://serp.ly/hotmovs-downloader',
        slug: 'hotmovs-downloader',
        tagline: 'Save HotMovs videos.',
        title: 'HotMovs Downloader'
      }
    }

    expect(
      normalizeTrialProduct(product, 'hotmovs-downloader', 'video-downloaders').legacySlugs
    ).toEqual(['hotmovsvideodownloader.pages.dev'])
    expect(
      canonicalizeTrialProducts(
        { 'hotmovs-downloader': product },
        { defaultCategory: 'video-downloaders' }
      )['hotmovs-downloader']?.product.legacySlugs
    ).toEqual(['hotmovsvideodownloader.pages.dev'])
  })
})

describe('getReservedRootRouteSegments', () => {
  it.each(['browserextensions.io', 'serp.ai', 'serpdownloaders.com'])(
    'reserves configured, starter, app, public, and category root routes for %s',
    siteId => {
      const reserved = getReservedRootRouteSegments(loadCheckedInSite(siteId))

      expect(reserved).toEqual(
        expect.arrayContaining([
          'brands',
          'categories',
          'legal',
          'posts',
          'products',
          'search',
          'submit',
          'video-downloaders'
        ])
      )
      expect(reserved).not.toContain('')
    }
  )

  it('reserves route-group children and public directories of the wrapper app', () => {
    const reserved = getReservedRootRouteSegments(loadCheckedInSite('serp.ai'))

    expect(reserved).toEqual(expect.arrayContaining(['cookies', 'media', 'badge', 'rss.xml']))
  })
})

describe('applyLegacyListingRedirects', () => {
  it('writes listing-base and root redirect pages with an absolute canonical and keeps them out of sitemaps', () => {
    const artifactDir = makeTempArtifactDir()

    writeFile(
      resolve(artifactDir, 'products/hotmovs-downloader/index.html'),
      listingPageHtml('https://serpdownloaders.com/products/hotmovs-downloader/')
    )
    writeFile(resolve(artifactDir, 'index.html'), listingPageHtml('https://serpdownloaders.com/'))

    const writtenPaths = applyLegacyListingRedirects(artifactDir, {
      listingBasePath: 'products',
      publicUrl: 'https://serpdownloaders.com',
      redirects: [{ legacySlug: 'hotmovsvideodownloader.pages.dev', slug: 'hotmovs-downloader' }]
    })

    expect(writtenPaths).toEqual([
      '/products/hotmovsvideodownloader.pages.dev',
      '/hotmovsvideodownloader.pages.dev'
    ])

    for (const routePath of writtenPaths) {
      const html = readFileSync(resolve(artifactDir, `.${routePath}/index.html`), 'utf8')

      expect(html).toContain(
        '<meta http-equiv="refresh" content="0; url=/products/hotmovs-downloader/">'
      )
      expect(html).toContain(
        '<link rel="canonical" href="https://serpdownloaders.com/products/hotmovs-downloader/">'
      )
      expect(html).not.toContain('noindex')
    }

    writeSplitSitemaps(artifactDir, {
      baseUrl: 'https://serpdownloaders.com',
      defaultLastmod: '2026-10-10T00:00:00.000Z',
      listingBasePath: 'products'
    })

    const listingsSitemap = readFileSync(resolve(artifactDir, 'listings-sitemap.xml'), 'utf8')
    const pagesSitemap = readFileSync(resolve(artifactDir, 'pages-sitemap.xml'), 'utf8')

    expect(listingsSitemap).toContain('https://serpdownloaders.com/products/hotmovs-downloader/')
    expect(listingsSitemap).not.toContain('hotmovsvideodownloader.pages.dev')
    expect(pagesSitemap).not.toContain('hotmovsvideodownloader.pages.dev')
  })

  it('also redirects the old suffixed detail route and targets the suffixed canonical route', () => {
    const artifactDir = makeTempArtifactDir()

    writeFile(
      resolve(artifactDir, 'products/new-tool/reviews/index.html'),
      listingPageHtml('https://serp.ai/products/new-tool/reviews/')
    )

    const writtenPaths = applyLegacyListingRedirects(artifactDir, {
      listingBasePath: '/products/',
      listingDetailSuffix: 'reviews',
      publicUrl: 'https://serp.ai/',
      redirects: [{ legacySlug: 'old-tool', slug: 'new-tool' }]
    })

    expect(writtenPaths).toEqual(['/products/old-tool', '/products/old-tool/reviews', '/old-tool'])
    expect(readFileSync(resolve(artifactDir, 'old-tool/index.html'), 'utf8')).toContain(
      '<link rel="canonical" href="https://serp.ai/products/new-tool/reviews/">'
    )
  })

  it('fails instead of overwriting a generated route', () => {
    const artifactDir = makeTempArtifactDir()

    writeFile(resolve(artifactDir, 'products/new-tool/index.html'), listingPageHtml('x'))
    writeFile(resolve(artifactDir, 'old-tool/index.html'), 'real page')

    expect(() =>
      applyLegacyListingRedirects(artifactDir, {
        listingBasePath: 'products',
        publicUrl: 'https://example.com',
        redirects: [{ legacySlug: 'old-tool', slug: 'new-tool' }]
      })
    ).toThrow('would overwrite the generated route /old-tool/')
    expect(readFileSync(resolve(artifactDir, 'old-tool/index.html'), 'utf8')).toBe('real page')
  })

  it('fails when the surviving listing page was not generated', () => {
    const artifactDir = makeTempArtifactDir()

    expect(() =>
      applyLegacyListingRedirects(artifactDir, {
        listingBasePath: 'products',
        publicUrl: 'https://example.com',
        redirects: [{ legacySlug: 'old-tool', slug: 'missing-tool' }]
      })
    ).toThrow('/products/missing-tool/, but that listing page was not generated')
    expect(existsSync(resolve(artifactDir, 'old-tool'))).toBe(false)
  })
})

describe('static redirect pages', () => {
  it('use an absolute canonical for root listing aliases too', () => {
    const artifactDir = makeTempArtifactDir()

    writeFile(
      resolve(artifactDir, 'products/instagram-downloader/index.html'),
      '<html><body>instagram</body></html>'
    )

    applyLegacyRootListingRedirects(artifactDir, {
      listingBasePath: 'products',
      publicUrl: 'https://serpdownloaders.com',
      siteId: 'serpdownloaders.com'
    })

    expect(readFileSync(resolve(artifactDir, 'instagram-downloader/index.html'), 'utf8')).toContain(
      '<link rel="canonical" href="https://serpdownloaders.com/products/instagram-downloader/">'
    )
  })

  it('escapes destination values in HTML attributes', () => {
    expect(buildStaticRedirectHtml('/products/a"b/', 'https://example.com')).toContain(
      'content="0; url=/products/a&quot;b/"'
    )
  })
})
