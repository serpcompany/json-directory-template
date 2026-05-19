import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'

const artifactRoot = resolve(process.cwd(), 'dist/sites/serp.ai')
const serpBrandsJsonPath = '/Users/devin/dev/repos/serp/docs/websites/pages/brands.json'
const localBrandsJsonPath = resolve(
  process.cwd(),
  'packages/web-core/src/data/network-brands.json'
)

const liveCategoryPaths = [
  '/products/best/adult/',
  '/products/best/course-platform-downloaders/',
  '/products/best/course-platforms/',
  '/products/best/fansite-downloaders/',
  '/products/best/gif-downloaders/',
  '/products/best/image-downloader/',
  '/products/best/image-downloaders/',
  '/products/best/image-hosting/',
  '/products/best/livestream/',
  '/products/best/livestream-downloaders/',
  '/products/best/movies-and-tv-downloaders/',
  '/products/best/movies-tv/',
  '/products/best/social-media/',
  '/products/best/social-media-downloaders/',
  '/products/best/video-downloaders/',
]

function readArtifactHtml(relativePath: string): string {
  return readFileSync(join(artifactRoot, relativePath), 'utf8')
}

function routeIndexExists(publicPath: string): boolean {
  const normalizedPath = publicPath.replace(/^\/+|\/+$/g, '')
  return existsSync(join(artifactRoot, normalizedPath, 'index.html'))
}

function listArtifactFiles(root: string, suffix: string): string[] {
  const files: string[] = []

  for (const entry of readdirSync(root)) {
    const entryPath = join(root, entry)
    const stat = statSync(entryPath)

    if (stat.isDirectory()) {
      files.push(...listArtifactFiles(entryPath, suffix))
      continue
    }

    if (entryPath.endsWith(suffix)) {
      files.push(entryPath)
    }
  }

  return files
}

function readSitemapLocs(relativePath: string): string[] {
  const xml = readFileSync(join(artifactRoot, relativePath), 'utf8')
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1] ?? '')
}

describe('serp.ai artifact links', () => {
  beforeAll(() => {
    expect(
      existsSync(artifactRoot),
      'Run `pnpm build:site -- --site serp.ai` before artifact tests.'
    ).toBe(true)
  })

  it('emits route indexes for live product, category, and brands pages', () => {
    expect(routeIndexExists('/products/tiktok-downloader/reviews')).toBe(true)
    expect(routeIndexExists('/products/best/video-downloaders')).toBe(true)
    expect(routeIndexExists('/brands')).toBe(true)
  })

  it('does not keep unsuffixed product detail artifact pages', () => {
    expect(routeIndexExists('/products/tiktok-downloader')).toBe(false)
  })

  it('emits trailing-slash internal links so linked pages do not need redirects', () => {
    const badLinks: string[] = []

    for (const filePath of listArtifactFiles(artifactRoot, '.html')) {
      const html = readFileSync(filePath, 'utf8')
      const hrefMatches = html.matchAll(/href="(\/[^"#?]+)([#?"])/g)

      for (const match of hrefMatches) {
        const href = match[1] ?? ''
        const marker = match[2] ?? ''

        if (
          href !== '/' &&
          !href.endsWith('/') &&
          !href.includes('.') &&
          marker !== '#'
        ) {
          badLinks.push(`${filePath.replace(`${artifactRoot}/`, '')}: ${href}`)
        }
      }
    }

    expect(badLinks).toEqual([])
  })

  it('emits trailing-slash final page URLs in every XML sitemap', () => {
    const sitemapPaths = [
      'sitemaps/pages/1.xml',
      'sitemaps/categories/1.xml',
      'sitemaps/directory/1.xml',
    ]
    const nonTrailingFinalUrls = sitemapPaths.flatMap(relativePath =>
      readSitemapLocs(relativePath).filter(url => !url.endsWith('/'))
    )

    expect(nonTrailingFinalUrls).toEqual([])
    expect(readSitemapLocs('sitemap-index.xml')).toEqual([
      'https://serp.ai/sitemaps/pages/1.xml',
      'https://serp.ai/sitemaps/categories/1.xml',
      'https://serp.ai/sitemaps/directory/1.xml',
    ])
  })

  it('matches live sitemap counts and category URL shape', () => {
    expect(readSitemapLocs('sitemaps/pages/1.xml')).toHaveLength(13)
    expect(readSitemapLocs('sitemaps/directory/1.xml')).toHaveLength(75)
    expect(
      readSitemapLocs('sitemaps/categories/1.xml')
        .map(url => new URL(url).pathname)
        .sort()
    ).toEqual(liveCategoryPaths.sort())
  })

  it('renders schema.org data on product and brands pages', () => {
    const productHtml = readArtifactHtml('products/tiktok-downloader/reviews/index.html')
    const brandsHtml = readArtifactHtml('brands/index.html')

    expect(productHtml).toContain('"@context":"https://schema.org"')
    expect(brandsHtml).toContain('"@context":"https://schema.org"')
    expect(brandsHtml).toContain('"@type":"CollectionPage"')
    expect(brandsHtml).toContain('"@type":"ItemList"')
  })

  it('renders all configured social links', () => {
    const html = readArtifactHtml('index.html')

    expect(html).toContain('https://github.com/serp-ai')
    expect(html).toContain('https://www.reddit.com/r/serpdotai/')
    expect(html).toContain('https://x.com/serpdotai')
    expect(html).toContain('https://www.linkedin.com/company/serpdotai')
    expect(html).toContain('https://www.youtube.com/@serpdotai')
    expect(html).toContain('https://facebook.com/serpdotai')
  })

  it('uses serp.ly product outbound links instead of apps.serp.co listing links', () => {
    const searchIndex = JSON.parse(
      readFileSync(join(artifactRoot, 'search/search-index.json'), 'utf8')
    ) as Array<{ slug: string; website: string }>
    const badSearchIndexEntries = searchIndex
      .filter(entry => entry.website.includes('apps.serp.co'))
      .map(entry => `${entry.slug}: ${entry.website}`)

    expect(badSearchIndexEntries).toEqual([])
  })

  it.runIf(existsSync(serpBrandsJsonPath))('keeps the brands page data in parity with the serp project source JSON', () => {
    const sourceBrands = JSON.parse(readFileSync(serpBrandsJsonPath, 'utf8'))
    const localBrands = JSON.parse(readFileSync(localBrandsJsonPath, 'utf8'))

    expect(localBrands).toEqual(sourceBrands)
  })
})
