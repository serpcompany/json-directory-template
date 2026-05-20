import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'

const artifactRoot = resolve(process.cwd(), 'dist/sites/serp.co')

function readArtifactHtml(relativePath: string): string {
  return readFileSync(join(artifactRoot, relativePath), 'utf8')
}

function routeIndexExists(publicPath: string): boolean {
  const normalizedPath = publicPath.replace(/^\/+|\/+$/g, '')
  return existsSync(join(artifactRoot, normalizedPath, 'index.html'))
}

function readRouteIndex(publicPath: string): string {
  const normalizedPath = publicPath.replace(/^\/+|\/+$/g, '')
  return readFileSync(join(artifactRoot, normalizedPath, 'index.html'), 'utf8')
}

function isRedirectOrErrorShell(publicPath: string): boolean {
  const html = readRouteIndex(publicPath)
  return html.includes('NEXT_REDIRECT') || html.includes('__next_error__')
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

describe('serp.co artifact links', () => {
  beforeAll(() => {
    expect(
      existsSync(artifactRoot),
      'Run `pnpm build:site -- --site serp.co` before artifact tests.'
    ).toBe(true)
  })

  it('keeps every artifact file under the Cloudflare Workers Assets limit', () => {
    const maxAssetBytes = 25 * 1024 * 1024
    const oversizedFiles = listArtifactFiles(artifactRoot, '')
      .filter(filePath => statSync(filePath).size > maxAssetBytes)
      .map(filePath => `${filePath.replace(`${artifactRoot}/`, '')}: ${statSync(filePath).size}`)

    expect(oversizedFiles).toEqual([])
  })

  it('emits route indexes for canonical product, category, brands, submit, and posts pages', () => {
    expect(routeIndexExists('/products/youtube-downloader/reviews')).toBe(true)
    expect(routeIndexExists('/products/best/video-downloaders')).toBe(true)
    expect(routeIndexExists('/brands')).toBe(true)
    expect(routeIndexExists('/submit')).toBe(true)
    expect(routeIndexExists('/posts')).toBe(true)
  })

  it('renders every featured downloader on the featured category artifact', () => {
    const products = JSON.parse(
      readFileSync(resolve(process.cwd(), 'sites/serp.co/products.json'), 'utf8')
    ) as Record<string, { featured?: boolean; product?: { slug?: string } }>
    const expectedFeaturedSlugs = Object.entries(products)
      .filter(([, product]) => product.featured === true)
      .map(([fallbackSlug, product]) => product.product?.slug ?? fallbackSlug)
      .sort()
    const html = readRouteIndex('/products/best/featured')
    const linkedFeaturedSlugs = [
      ...new Set(
        [...html.matchAll(/href="\/products\/([^"/]+)\/reviews\/"/g)].map(match => match[1] ?? '')
      )
    ].sort()

    expect(expectedFeaturedSlugs.length).toBeGreaterThan(8)
    expect(linkedFeaturedSlugs).toEqual(expectedFeaturedSlugs)
  })

  it('does not keep unsuffixed product detail artifact pages', () => {
    expect(routeIndexExists('/products/youtube-downloader')).toBe(false)
  })

  it('emits trailing-slash internal links and never links to doubled reviews paths', () => {
    const badLinks: string[] = []
    const doubledReviewLinks: string[] = []

    for (const filePath of listArtifactFiles(artifactRoot, '.html')) {
      const html = readFileSync(filePath, 'utf8')
      const hrefMatches = html.matchAll(/href="(\/[^"#?]+)([#?"])/g)

      if (html.includes('/reviews/reviews/')) {
        doubledReviewLinks.push(filePath.replace(`${artifactRoot}/`, ''))
      }

      for (const match of hrefMatches) {
        const href = match[1] ?? ''
        const marker = match[2] ?? ''

        if (href !== '/' && !href.endsWith('/') && !href.includes('.') && marker !== '#') {
          badLinks.push(`${filePath.replace(`${artifactRoot}/`, '')}: ${href}`)
        }
      }
    }

    expect(badLinks).toEqual([])
    expect(doubledReviewLinks).toEqual([])
  })

  it('links only to generated internal route targets', () => {
    const badTargets = new Map<string, string>()
    const shellTargets = new Map<string, string>()
    const routeExistsCache = new Map<string, boolean>()
    const shellCache = new Map<string, boolean>()

    function cachedRouteIndexExists(publicPath: string): boolean {
      const cached = routeExistsCache.get(publicPath)

      if (cached !== undefined) {
        return cached
      }

      const exists = routeIndexExists(publicPath)
      routeExistsCache.set(publicPath, exists)
      return exists
    }

    function cachedIsRedirectOrErrorShell(publicPath: string): boolean {
      const cached = shellCache.get(publicPath)

      if (cached !== undefined) {
        return cached
      }

      const isShell = isRedirectOrErrorShell(publicPath)
      shellCache.set(publicPath, isShell)
      return isShell
    }

    for (const filePath of listArtifactFiles(artifactRoot, '.html')) {
      const html = readFileSync(filePath, 'utf8')
      const hrefMatches = html.matchAll(/href="([^"]+)"/g)

      for (const match of hrefMatches) {
        const href = match[1] ?? ''
        const url = href.startsWith('https://serp.co')
          ? new URL(href)
          : href.startsWith('/')
            ? new URL(href, 'https://serp.co')
            : null

        if (!url) {
          continue
        }

        const publicPath = url.pathname

        if (
          publicPath.startsWith('/_next/') ||
          (publicPath.includes('.') && !publicPath.startsWith('/products/'))
        ) {
          continue
        }

        const targetExists = cachedRouteIndexExists(publicPath)

        if (!targetExists && !badTargets.has(publicPath)) {
          badTargets.set(publicPath, filePath.replace(`${artifactRoot}/`, ''))
          continue
        }

        if (
          targetExists &&
          cachedIsRedirectOrErrorShell(publicPath) &&
          !shellTargets.has(publicPath)
        ) {
          shellTargets.set(publicPath, filePath.replace(`${artifactRoot}/`, ''))
        }
      }
    }

    expect(
      [...badTargets.entries()].map(([target, source]) => `${target} from ${source}`).sort()
    ).toEqual([])
    expect(
      [...shellTargets.entries()].map(([target, source]) => `${target} from ${source}`).sort()
    ).toEqual([])
  })

  it('emits trailing-slash final page URLs in every XML sitemap', () => {
    const sitemapPaths = [
      'sitemaps/pages/1.xml',
      'sitemaps/blog/1.xml',
      'sitemaps/categories/1.xml',
      'sitemaps/directory/1.xml'
    ]
    const nonTrailingFinalUrls = sitemapPaths.flatMap(relativePath =>
      readSitemapLocs(relativePath).filter(url => !url.endsWith('/'))
    )
    const doubledReviewUrls = sitemapPaths.flatMap(relativePath =>
      readSitemapLocs(relativePath).filter(url => url.includes('/reviews/reviews/'))
    )

    expect(nonTrailingFinalUrls).toEqual([])
    expect(doubledReviewUrls).toEqual([])
    expect(readSitemapLocs('sitemap-index.xml')).toEqual([
      'https://serp.co/sitemaps/pages/1.xml',
      'https://serp.co/sitemaps/directory/1.xml',
      'https://serp.co/sitemaps/categories/1.xml',
      'https://serp.co/sitemaps/blog/1.xml'
    ])
  })

  it('emits XML sitemap locs only for generated route targets', () => {
    const sitemapPaths = [
      'sitemaps/pages/1.xml',
      'sitemaps/blog/1.xml',
      'sitemaps/categories/1.xml',
      'sitemaps/directory/1.xml'
    ]
    const badTargets = sitemapPaths.flatMap(relativePath =>
      readSitemapLocs(relativePath)
        .map(url => new URL(url).pathname)
        .filter(pathname => !routeIndexExists(pathname))
        .map(pathname => `${relativePath}: ${pathname}`)
    )

    expect(badTargets).toEqual([])
  })

  it('does not emit duplicate legacy root sitemap files', () => {
    expect(existsSync(join(artifactRoot, 'pages-sitemap.xml'))).toBe(false)
    expect(existsSync(join(artifactRoot, 'listings-sitemap.xml'))).toBe(false)
    expect(existsSync(join(artifactRoot, 'taxonomies-sitemap.xml'))).toBe(false)
    expect(existsSync(join(artifactRoot, 'docs-sitemap.xml'))).toBe(false)
    expect(existsSync(join(artifactRoot, 'posts-sitemap.xml'))).toBe(false)
  })

  it('renders schema.org data on product, category, brands, and homepage surfaces', () => {
    const homeHtml = readArtifactHtml('index.html')
    const productHtml = readArtifactHtml('products/youtube-downloader/reviews/index.html')
    const categoryHtml = readArtifactHtml('products/best/video-downloaders/index.html')
    const brandsHtml = readArtifactHtml('brands/index.html')

    expect(homeHtml).toContain('"@context":"https://schema.org"')
    expect(productHtml).toContain('"@context":"https://schema.org"')
    expect(categoryHtml).toContain('"@type":"CollectionPage"')
    expect(brandsHtml).toContain('"@type":"CollectionPage"')
    expect(brandsHtml).toContain('"@type":"ItemList"')
  })

  it('renders configured social links from the source export', () => {
    const html = readArtifactHtml('index.html')

    expect(html).toContain('https://github.com/serpcompany')
    expect(html).toContain('https://www.reddit.com/r/serpapps/')
    expect(html).toContain('https://x.com/serpdotco')
    expect(html).toContain('https://serp.ly/@serp/linkedin')
    expect(html).toContain('https://serp.ly/@serp/youtube')
    expect(html).toContain('https://serp.ly/@serp/facebook')
    expect(html).toContain('https://serp.ly/@serp/instagram')
  })

  it('uses serp.ly downloader outbound links instead of apps.serp.co listing links', () => {
    const searchIndex = JSON.parse(
      readFileSync(join(artifactRoot, 'search/search-index.json'), 'utf8')
    ) as Array<{ categories?: string[]; category?: string; slug: string; website: string }>
    const downloaderEntries = searchIndex.filter(
      entry =>
        entry.categories?.includes('video-downloaders') || entry.category === 'video-downloaders'
    )
    const badDownloaderEntries = downloaderEntries
      .filter(entry => !entry.website.startsWith('https://serp.ly/'))
      .map(entry => `${entry.slug}: ${entry.website}`)

    expect(downloaderEntries.length).toBeGreaterThan(0)
    expect(badDownloaderEntries).toEqual([])
  })
})
