import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { writeSplitSitemaps } from './sitemap-files.ts'

const tempDirs: string[] = []

function makeTempArtifactDir(): string {
  mkdirSync(resolve(process.cwd(), 'tmp'), { recursive: true })
  const dir = mkdtempSync(resolve(process.cwd(), 'tmp/sitemap-files-'))
  tempDirs.push(dir)
  return dir
}

function writeFile(path: string, contents = 'test'): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, contents)
}

afterEach(() => {
  tempDirs.splice(0).forEach(dir => {
    rmSync(dir, { force: true, recursive: true })
  })
})

describe('writeSplitSitemaps', () => {
  it('writes sitemap index files and grouped page files for the static artifact', () => {
    const artifactDir = makeTempArtifactDir()

    writeFile(resolve(artifactDir, 'index.html'))
    writeFile(resolve(artifactDir, 'about/index.html'))
    writeFile(resolve(artifactDir, 'docs/index.html'))
    writeFile(resolve(artifactDir, 'products/index.html'))
    writeFile(resolve(artifactDir, 'products/example-tool/index.html'))
    writeFile(resolve(artifactDir, 'categories/developer-tools/index.html'))
    writeFile(resolve(artifactDir, 'categories/featured/index.html'))
    writeFile(resolve(artifactDir, 'cookies/index.html'))
    writeFile(resolve(artifactDir, 'news/index.html'))
    writeFile(resolve(artifactDir, 'privacy/index.html'))
    writeFile(resolve(artifactDir, 'terms/index.html'))
    writeFile(resolve(artifactDir, 'legal/privacy/index.html'))
    writeFile(resolve(artifactDir, 'search/index.html'))
    writeFile(resolve(artifactDir, 'submit/index.html'))
    writeFile(resolve(artifactDir, '404.html'))

    writeSplitSitemaps(artifactDir, {
      baseUrl: 'https://example.com',
      listingBasePath: 'products'
    })

    expect(existsSync(resolve(artifactDir, 'sitemap-index.xml'))).toBe(true)
    expect(existsSync(resolve(artifactDir, 'sitemap.xml'))).toBe(true)
    expect(existsSync(resolve(artifactDir, 'pages-sitemap.xml'))).toBe(true)
    expect(existsSync(resolve(artifactDir, 'listings-sitemap.xml'))).toBe(true)
    expect(existsSync(resolve(artifactDir, 'taxonomies-sitemap.xml'))).toBe(true)
    expect(existsSync(resolve(artifactDir, 'docs-sitemap.xml'))).toBe(true)

    expect(readFileSync(resolve(artifactDir, 'sitemap-index.xml'), 'utf8')).toContain(
      '<loc>https://example.com/pages-sitemap.xml</loc>'
    )
    expect(readFileSync(resolve(artifactDir, 'sitemap-index.xml'), 'utf8')).toContain(
      '<loc>https://example.com/listings-sitemap.xml</loc>'
    )
    expect(readFileSync(resolve(artifactDir, 'sitemap-index.xml'), 'utf8')).toContain(
      '<loc>https://example.com/taxonomies-sitemap.xml</loc>'
    )
    expect(readFileSync(resolve(artifactDir, 'sitemap-index.xml'), 'utf8')).toContain(
      '<loc>https://example.com/docs-sitemap.xml</loc>'
    )
    expect(readFileSync(resolve(artifactDir, 'sitemap-index.xml'), 'utf8')).toContain(
      '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    )
    expect(readFileSync(resolve(artifactDir, 'sitemap.xml'), 'utf8')).toBe(
      readFileSync(resolve(artifactDir, 'sitemap-index.xml'), 'utf8')
    )

    const pagesSitemap = readFileSync(resolve(artifactDir, 'pages-sitemap.xml'), 'utf8')
    expect(pagesSitemap).toContain('<loc>https://example.com/</loc>')
    expect(pagesSitemap).toContain('<loc>https://example.com/about</loc>')
    expect(pagesSitemap).toContain('<loc>https://example.com/legal/privacy</loc>')
    expect(pagesSitemap).not.toContain('https://example.com/cookies')
    expect(pagesSitemap).not.toContain('https://example.com/news')
    expect(pagesSitemap).not.toContain('https://example.com/privacy')
    expect(pagesSitemap).not.toContain('https://example.com/terms')
    expect(pagesSitemap).not.toContain('https://example.com/search')
    expect(pagesSitemap).not.toContain('https://example.com/submit')

    const listingSitemap = readFileSync(resolve(artifactDir, 'listings-sitemap.xml'), 'utf8')
    expect(listingSitemap).toContain('<loc>https://example.com/products/example-tool</loc>')

    const taxonomiesSitemap = readFileSync(resolve(artifactDir, 'taxonomies-sitemap.xml'), 'utf8')
    expect(taxonomiesSitemap).toContain('<loc>https://example.com/products</loc>')
    expect(taxonomiesSitemap).toContain(
      '<loc>https://example.com/categories/developer-tools</loc>'
    )
    expect(taxonomiesSitemap).toContain('<loc>https://example.com/categories/featured</loc>')

    const docsSitemap = readFileSync(resolve(artifactDir, 'docs-sitemap.xml'), 'utf8')
    expect(docsSitemap).toContain('<loc>https://example.com/docs</loc>')
  })

  it('skips optional sitemap families when there are no matching public routes', () => {
    const artifactDir = makeTempArtifactDir()

    writeFile(resolve(artifactDir, 'index.html'))
    writeFile(resolve(artifactDir, 'products/index.html'))
    writeFile(resolve(artifactDir, 'products/example-tool/index.html'))

    writeSplitSitemaps(artifactDir, {
      baseUrl: 'https://example.com',
      listingBasePath: 'products'
    })

    expect(existsSync(resolve(artifactDir, 'taxonomies-sitemap.xml'))).toBe(true)
    expect(existsSync(resolve(artifactDir, 'docs-sitemap.xml'))).toBe(false)
    expect(existsSync(resolve(artifactDir, 'posts-sitemap.xml'))).toBe(false)
    expect(readFileSync(resolve(artifactDir, 'sitemap-index.xml'), 'utf8')).not.toContain(
      'docs-sitemap.xml'
    )
    expect(readFileSync(resolve(artifactDir, 'sitemap-index.xml'), 'utf8')).not.toContain(
      'posts-sitemap.xml'
    )
  })

  it('splits large sitemap groups into multiple files using the configured page size', () => {
    const artifactDir = makeTempArtifactDir()

    writeFile(resolve(artifactDir, 'index.html'))
    writeFile(resolve(artifactDir, 'about/index.html'))
    writeFile(resolve(artifactDir, 'docs/index.html'))
    writeFile(resolve(artifactDir, 'legal/privacy/index.html'))

    writeSplitSitemaps(artifactDir, {
      baseUrl: 'https://example.com',
      listingBasePath: 'products',
      pageSize: 2
    })

    expect(existsSync(resolve(artifactDir, 'pages-sitemap-0.xml'))).toBe(true)
    expect(existsSync(resolve(artifactDir, 'pages-sitemap-1.xml'))).toBe(true)
    expect(readFileSync(resolve(artifactDir, 'pages-sitemap.xml'), 'utf8')).toContain(
      '<loc>https://example.com/pages-sitemap-0.xml</loc>'
    )
    expect(readFileSync(resolve(artifactDir, 'pages-sitemap.xml'), 'utf8')).toContain(
      '<loc>https://example.com/pages-sitemap-1.xml</loc>'
    )
  })

  it('excludes configured legacy root listing aliases from sitemap output', () => {
    const artifactDir = makeTempArtifactDir()

    writeFile(resolve(artifactDir, 'index.html'))
    writeFile(resolve(artifactDir, 'products/index.html'))
    writeFile(resolve(artifactDir, 'products/example-tool/index.html'))
    writeFile(resolve(artifactDir, 'example-tool/index.html'))

    writeSplitSitemaps(artifactDir, {
      baseUrl: 'https://example.com',
      excludedPaths: ['/example-tool'],
      listingBasePath: 'products',
    })

    const pagesSitemap = readFileSync(resolve(artifactDir, 'pages-sitemap.xml'), 'utf8')
    const listingsSitemap = readFileSync(resolve(artifactDir, 'listings-sitemap.xml'), 'utf8')

    expect(pagesSitemap).not.toContain('<loc>https://example.com/example-tool</loc>')
    expect(listingsSitemap).not.toContain('<loc>https://example.com/example-tool</loc>')
    expect(listingsSitemap).toContain(
      '<loc>https://example.com/products/example-tool</loc>'
    )
  })
})
