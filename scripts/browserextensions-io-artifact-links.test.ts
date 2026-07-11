import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'

const artifactRoot = resolve(process.cwd(), 'dist/sites/browserextensions.io')
const nextyExportRoot = '/Users/devin/dev/repos/nexty-monorepo/tmp/browserextensions-io'
const serpBrandsJsonPath = '/Users/devin/dev/repos/serp/docs/websites/pages/brands.json'
const localBrandsJsonPath = resolve(process.cwd(), 'packages/web-core/src/data/network-brands.json')
const browserextensionsProductsJsonPath = resolve(
  process.cwd(),
  'sites/browserextensions.io/products.json'
)

function readArtifactHtml(relativePath: string): string {
  return readFileSync(join(artifactRoot, relativePath), 'utf8')
}

function routeIndexExists(publicPath: string): boolean {
  const normalizedPath = publicPath.replace(/^\/+|\/+$/g, '')
  return existsSync(join(artifactRoot, normalizedPath, 'index.html'))
}

function sha256(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
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

describe('browserextensions.io artifact links', () => {
  beforeAll(() => {
    expect(
      existsSync(artifactRoot),
      'Run `pnpm build:site -- --site browserextensions.io` before artifact tests.'
    ).toBe(true)
  })

  it('does not emit known broken internal links', () => {
    const html = readArtifactHtml('index.html')

    expect(html).not.toContain('href="/legal/privacy"')
    expect(html).not.toContain('href="/legal/terms"')
    expect(html).not.toContain('href="/network"')
  })

  it('emits route indexes for UI-linked search, products, and featured pages', () => {
    expect(routeIndexExists('/search')).toBe(true)
    expect(routeIndexExists('/products')).toBe(true)
    expect(routeIndexExists('/categories/featured')).toBe(true)
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

  it('emits trailing-slash final page URLs in every XML sitemap', () => {
    const sitemapPaths = [
      'sitemaps/pages/1.xml',
      'sitemaps/directory/1.xml',
      'sitemaps/categories/1.xml'
    ]
    const nonTrailingFinalUrls = sitemapPaths.flatMap(relativePath =>
      readSitemapLocs(relativePath).filter(url => !url.endsWith('/'))
    )

    expect(nonTrailingFinalUrls).toEqual([])
    expect(readSitemapLocs('sitemap-index.xml')).toEqual([
      'https://browserextensions.io/sitemaps/pages/1.xml',
      'https://browserextensions.io/sitemaps/directory/1.xml',
      'https://browserextensions.io/sitemaps/categories/1.xml'
    ])
  })

  it('does not emit duplicate legacy root sitemap files', () => {
    expect(existsSync(join(artifactRoot, 'pages-sitemap.xml'))).toBe(false)
    expect(existsSync(join(artifactRoot, 'listings-sitemap.xml'))).toBe(false)
    expect(existsSync(join(artifactRoot, 'taxonomies-sitemap.xml'))).toBe(false)
    expect(existsSync(join(artifactRoot, 'docs-sitemap.xml'))).toBe(false)
    expect(existsSync(join(artifactRoot, 'posts-sitemap.xml'))).toBe(false)
  })

  it('renders all configured social links and includes them in website schema', () => {
    const html = readArtifactHtml('index.html')

    expect(html).toContain('https://github.com/serpcompany')
    expect(html).toContain('https://www.reddit.com/r/BrowserExtensionsIO/')
    expect(html).toContain('https://x.com/serpcompany')
    expect(html).toContain('https://www.linkedin.com/company/browserextensions-io')
    expect(html).toContain('https://www.youtube.com/@browserextensionsio')
  })

  it('renders schema.org data on the brands page', () => {
    const html = readArtifactHtml('brands/index.html')

    expect(html).toContain('"@context":"https://schema.org"')
    expect(html).toContain('"@type":"CollectionPage"')
    expect(html).toContain('"@type":"ItemList"')
  })

  it('uses serp.ly product outbound links instead of apps.serp.co listing links', () => {
    const sourceProducts = JSON.parse(
      readFileSync(browserextensionsProductsJsonPath, 'utf8')
    ) as Record<
      string,
      {
        content?: { body?: string }
        product?: { productPage?: string; slug?: string }
      }
    >
    const searchIndex = JSON.parse(
      readFileSync(join(artifactRoot, 'search/search-index.json'), 'utf8')
    ) as Array<{ slug: string; website: string }>
    const badSourceProductPages: string[] = []
    const badSourceBodyLinks: string[] = []
    const missingSerpLyProductPages: string[] = []
    const badSearchIndexEntries: string[] = []

    for (const [key, entry] of Object.entries(sourceProducts)) {
      const productPage = entry.product?.productPage ?? ''
      const body = entry.content?.body ?? ''
      const slug = entry.product?.slug ?? key

      if (productPage.includes('apps.serp.co')) {
        badSourceProductPages.push(`${slug}: ${productPage}`)
      }

      if (!productPage.startsWith('https://serp.ly/')) {
        missingSerpLyProductPages.push(`${slug}: ${productPage}`)
      }

      if (body.includes('https://apps.serp.co/')) {
        badSourceBodyLinks.push(slug)
      }
    }

    for (const entry of searchIndex) {
      if (entry.website.includes('apps.serp.co')) {
        badSearchIndexEntries.push(`${entry.slug}: ${entry.website}`)
      }
    }

    expect(badSourceProductPages).toEqual([])
    expect(badSourceBodyLinks).toEqual([])
    expect(missingSerpLyProductPages).toEqual([])
    expect(badSearchIndexEntries).toEqual([])
  })

  it('does not render direct LaunchBuzz outbound links for the migrated product entry', () => {
    const html = readArtifactHtml('products/launchbuzz.io/index.html')

    expect(html).toContain('href="https://serp.ly/launchbuzz.io?via=browserextensions.io"')
    expect(html).not.toContain('href="https://launchbuzz.io"')
    expect(html).not.toContain('href="https://launchbuzz.io/projects/submit"')
    expect(html).not.toContain('href="https://launchbuzz.io/pricing"')
  })

  it('renders BrowserExtensions.io about copy from the site-owned content source', () => {
    const html = readArtifactHtml('about/index.html')

    expect(html).toContain(
      'BrowserExtensions.io is for people who know they need a browser extension'
    )
    expect(html).toContain('Browser stores are good for installation')
    expect(html).not.toContain('contact@example.com')
    expect(html).not.toContain('marketing@serp.co')
    expect(html).not.toContain('directory starter')
    expect(html).not.toContain('great products')
  })

  it.runIf(existsSync(nextyExportRoot))(
    'keeps the exported apple touch icon in the static artifact',
    () => {
      expect(sha256(join(artifactRoot, 'apple-touch-icon.png'))).toBe(
        sha256(join(nextyExportRoot, 'public/apple-touch-icon.png'))
      )
    }
  )

  it.runIf(existsSync(serpBrandsJsonPath))(
    'keeps the brands page data in parity with the serp project source JSON',
    () => {
      const sourceBrands = JSON.parse(readFileSync(serpBrandsJsonPath, 'utf8'))
      const localBrands = JSON.parse(readFileSync(localBrandsJsonPath, 'utf8'))

      expect(localBrands).toEqual(sourceBrands)
    }
  )
})
