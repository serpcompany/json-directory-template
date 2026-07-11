import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const artifactRoot = resolve(process.cwd(), 'dist/sites/serp.ai')
const serpBrandsJsonPath = '/Users/devin/dev/repos/serp/docs/websites/pages/brands.json'
const localBrandsJsonPath = resolve(process.cwd(), 'packages/web-core/src/data/network-brands.json')

const liveCategoryPaths = [
  '/products/best/adult/',
  '/products/best/course-platform-downloaders/',
  '/products/best/fansite-downloaders/',
  '/products/best/gif-downloaders/',
  '/products/best/image-downloaders/',
  '/products/best/livestream-downloaders/',
  '/products/best/movies-and-tv-downloaders/',
  '/products/best/product-launch-websites/',
  '/products/best/social-media-downloaders/',
  '/products/best/video-downloaders/'
]

function readArtifactHtml(relativePath: string): string {
  return readFileSync(join(artifactRoot, relativePath), 'utf8')
}

function routeIndexExists(publicPath: string): boolean {
  const normalizedPath = publicPath.replace(/^\/+|\/+$/g, '')
  return existsSync(join(artifactRoot, normalizedPath, 'index.html'))
}

function normalizePublicPath(publicPath: string): string {
  const normalizedPath = publicPath.replace(/^\/+|\/+$/g, '')
  return normalizedPath ? `/${normalizedPath}` : '/'
}

function artifactPathExists(publicPath: string): boolean {
  const normalizedPath = normalizePublicPath(publicPath)

  if (normalizedPath === '/') {
    return existsSync(join(artifactRoot, 'index.html'))
  }

  if (extname(normalizedPath)) {
    return existsSync(join(artifactRoot, normalizedPath.slice(1)))
  }

  return routeIndexExists(normalizedPath)
}

function readRouteHtml(publicPath: string): string | null {
  const normalizedPath = normalizePublicPath(publicPath)
  const routePath =
    normalizedPath === '/'
      ? join(artifactRoot, 'index.html')
      : join(artifactRoot, normalizedPath.slice(1), 'index.html')

  return existsSync(routePath) ? readFileSync(routePath, 'utf8') : null
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

function shouldCheckInternalHref(href: string): boolean {
  return (
    href.startsWith('/') &&
    !href.startsWith('//') &&
    !href.startsWith('/_next/') &&
    !href.startsWith('/badge/') &&
    !href.startsWith('/fonts/') &&
    !href.startsWith('/media/')
  )
}

describe.runIf(existsSync(artifactRoot))('serp.ai artifact links', () => {
  it('emits route indexes for live product, category, and brands pages', () => {
    expect(routeIndexExists('/products/tiktok-downloader/reviews')).toBe(true)
    expect(routeIndexExists('/products/best/video-downloaders')).toBe(true)
    expect(routeIndexExists('/categories/featured')).toBe(true)
    expect(routeIndexExists('/categories')).toBe(true)
    expect(routeIndexExists('/brands')).toBe(true)
  })

  it('redirects the legacy featured product category to the canonical featured page', () => {
    const html = readRouteHtml('/products/best/featured')

    expect(html).toContain('NEXT_REDIRECT')
    expect(html).toContain('/categories/featured/')
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

        if (href !== '/' && !href.endsWith('/') && !href.includes('.') && marker !== '#') {
          badLinks.push(`${filePath.replace(`${artifactRoot}/`, '')}: ${href}`)
        }
      }
    }

    expect(badLinks).toEqual([])
  })

  it('emits internal links to generated non-redirect artifact pages', () => {
    const badLinks: string[] = []

    for (const filePath of listArtifactFiles(artifactRoot, '.html')) {
      if (filePath.endsWith('/404.html')) {
        continue
      }

      const html = readFileSync(filePath, 'utf8')
      const hrefMatches = html.matchAll(/href="([^"]+)"/g)

      for (const match of hrefMatches) {
        const href = match[1] ?? ''

        if (!shouldCheckInternalHref(href)) {
          continue
        }

        const url = new URL(href, 'https://serp.ai')
        const publicPath = normalizePublicPath(url.pathname)
        const source = filePath.replace(`${artifactRoot}/`, '')

        if (!artifactPathExists(publicPath)) {
          badLinks.push(`${source}: missing ${publicPath}`)
          continue
        }

        const targetHtml = readRouteHtml(publicPath)
        if (
          targetHtml?.includes('NEXT_REDIRECT') ||
          targetHtml?.includes('__next_error__') ||
          targetHtml?.includes('<meta http-equiv="refresh"')
        ) {
          badLinks.push(`${source}: redirect/error ${publicPath}`)
        }
      }
    }

    expect(badLinks).toEqual([])
  }, 10_000)

  it('emits trailing-slash final page URLs in every XML sitemap', () => {
    const sitemapPaths = [
      'sitemaps/pages/1.xml',
      'sitemaps/categories/1.xml',
      'sitemaps/directory/1.xml'
    ]
    const nonTrailingFinalUrls = sitemapPaths.flatMap(relativePath =>
      readSitemapLocs(relativePath).filter(url => !url.endsWith('/'))
    )

    expect(nonTrailingFinalUrls).toEqual([])
    expect(readSitemapLocs('sitemap-index.xml')).toEqual([
      'https://serp.ai/sitemaps/pages/1.xml',
      'https://serp.ai/sitemaps/categories/1.xml',
      'https://serp.ai/sitemaps/directory/1.xml'
    ])
  })

  it('matches accepted sitemap counts and category URL shape', () => {
    expect(readSitemapLocs('sitemaps/pages/1.xml')).toHaveLength(8)
    expect(readSitemapLocs('sitemaps/directory/1.xml')).toHaveLength(292)
    expect(
      readSitemapLocs('sitemaps/categories/1.xml')
        .map(url => new URL(url).pathname)
        .sort()
    ).toEqual(liveCategoryPaths.sort())
    expect(readSitemapLocs('sitemaps/categories/1.xml').join('\n')).not.toContain(
      '/categories/featured/'
    )
    expect(readSitemapLocs('sitemaps/categories/1.xml').join('\n')).not.toContain(
      '/products/best/featured/'
    )
  })

  it('does not emit duplicate legacy root sitemap files', () => {
    expect(existsSync(join(artifactRoot, 'pages-sitemap.xml'))).toBe(false)
    expect(existsSync(join(artifactRoot, 'listings-sitemap.xml'))).toBe(false)
    expect(existsSync(join(artifactRoot, 'taxonomies-sitemap.xml'))).toBe(false)
    expect(existsSync(join(artifactRoot, 'docs-sitemap.xml'))).toBe(false)
    expect(existsSync(join(artifactRoot, 'posts-sitemap.xml'))).toBe(false)
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
    expect(html).toContain('https://serp.ly/@serpai/youtube')
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

  it.runIf(existsSync(serpBrandsJsonPath))(
    'keeps the brands page data in parity with the serp project source JSON',
    () => {
      const sourceBrands = JSON.parse(readFileSync(serpBrandsJsonPath, 'utf8'))
      const localBrands = JSON.parse(readFileSync(localBrandsJsonPath, 'utf8'))

      expect(localBrands).toEqual(sourceBrands)
    }
  )
})
