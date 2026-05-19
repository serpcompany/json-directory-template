import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { resolveCheckedInSiteConfig } from '@thedaviddias/site-contract'
import { afterEach, describe, expect, it } from 'vitest'
import { auditArtifactSitemaps, parseSitemapLocs } from './audit-sitemaps.ts'

const tempDirs: string[] = []

function makeTempArtifactDir(): string {
  mkdirSync(resolve(process.cwd(), 'tmp'), { recursive: true })
  const dir = mkdtempSync(resolve(process.cwd(), 'tmp/audit-sitemaps-'))
  tempDirs.push(dir)
  return dir
}

function writeFile(path: string, contents = 'test'): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, contents)
}

function makeSiteConfig(artifactDir: string) {
  const siteConfig = resolveCheckedInSiteConfig('browserextensions.io')

  return {
    ...siteConfig,
    build: {
      ...siteConfig.build,
      artifactDir: relative(process.cwd(), artifactDir),
    },
    site: {
      ...siteConfig.site,
      domain: 'example.com',
      publicUrl: 'https://example.com',
    },
  }
}

function writeSitemapShellFiles(artifactDir: string): void {
  const sitemapIndex = [
    '<sitemapindex>',
    '<sitemap><loc>https://example.com/sitemaps/pages/1.xml</loc></sitemap>',
    '</sitemapindex>',
  ].join('')

  writeFile(resolve(artifactDir, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: https://example.com/sitemap-index.xml\n')
  writeFile(resolve(artifactDir, 'sitemap-index.xml'), sitemapIndex)
  writeFile(resolve(artifactDir, 'sitemap.xml'), sitemapIndex)
}

afterEach(() => {
  tempDirs.splice(0).forEach(dir => {
    if (existsSync(dir)) {
      rmSync(dir, { force: true, recursive: true })
    }
  })
})

describe('parseSitemapLocs', () => {
  it('extracts and decodes sitemap loc values', () => {
    expect(
      parseSitemapLocs(
        '<urlset><url><loc>https://example.com/a&amp;b/</loc></url></urlset>'
      )
    ).toEqual(['https://example.com/a&b/'])
  })
})

describe('auditArtifactSitemaps', () => {
  it('passes when sitemap index, child sitemap files, and route artifacts line up', () => {
    const artifactDir = makeTempArtifactDir()

    writeSitemapShellFiles(artifactDir)
    writeFile(
      resolve(artifactDir, 'sitemaps/pages/1.xml'),
      [
        '<urlset>',
        '<url><loc>https://example.com/</loc></url>',
        '<url><loc>https://example.com/about/</loc></url>',
        '</urlset>',
      ].join('')
    )
    writeFile(resolve(artifactDir, 'index.html'))
    writeFile(resolve(artifactDir, 'about/index.html'))

    const audit = auditArtifactSitemaps(makeSiteConfig(artifactDir))

    expect(audit.urlCount).toBe(2)
    expect(audit.issues).toEqual([])
  })

  it('reports missing child sitemap files from the sitemap index', () => {
    const artifactDir = makeTempArtifactDir()

    const sitemapIndex =
      '<sitemapindex><sitemap><loc>https://example.com/sitemaps/missing.xml</loc></sitemap></sitemapindex>'
    writeFile(resolve(artifactDir, 'robots.txt'), 'Sitemap: https://example.com/sitemap-index.xml\n')
    writeFile(resolve(artifactDir, 'sitemap-index.xml'), sitemapIndex)
    writeFile(resolve(artifactDir, 'sitemap.xml'), sitemapIndex)

    const audit = auditArtifactSitemaps(makeSiteConfig(artifactDir))

    expect(audit.issues).toContainEqual(
      expect.objectContaining({
        message: 'Sitemap file referenced by index is missing from artifact.',
        severity: 'error',
        sitemapUrl: 'https://example.com/sitemaps/missing.xml',
      })
    )
  })

  it('reports sitemap URLs without generated route artifacts', () => {
    const artifactDir = makeTempArtifactDir()

    const sitemapIndex =
      '<sitemapindex><sitemap><loc>https://example.com/pages-sitemap.xml</loc></sitemap></sitemapindex>'
    writeFile(resolve(artifactDir, 'robots.txt'), 'Sitemap: https://example.com/sitemap-index.xml\n')
    writeFile(resolve(artifactDir, 'sitemap-index.xml'), sitemapIndex)
    writeFile(resolve(artifactDir, 'sitemap.xml'), sitemapIndex)
    writeFile(
      resolve(artifactDir, 'pages-sitemap.xml'),
      '<urlset><url><loc>https://example.com/missing-page/</loc></url></urlset>'
    )

    const audit = auditArtifactSitemaps(makeSiteConfig(artifactDir))

    expect(audit.issues).toContainEqual(
      expect.objectContaining({
        message: 'Sitemap entry does not map to a generated route artifact.',
        severity: 'error',
        url: 'https://example.com/missing-page/',
      })
    )
  })

  it('reports excluded paths that leak into sitemap output', () => {
    const artifactDir = makeTempArtifactDir()
    const siteConfig = makeSiteConfig(artifactDir)

    const sitemapIndex =
      '<sitemapindex><sitemap><loc>https://example.com/pages-sitemap.xml</loc></sitemap></sitemapindex>'
    writeFile(resolve(artifactDir, 'robots.txt'), 'Sitemap: https://example.com/sitemap-index.xml\n')
    writeFile(resolve(artifactDir, 'sitemap-index.xml'), sitemapIndex)
    writeFile(resolve(artifactDir, 'sitemap.xml'), sitemapIndex)
    writeFile(
      resolve(artifactDir, 'pages-sitemap.xml'),
      '<urlset><url><loc>https://example.com/search/</loc></url></urlset>'
    )
    writeFile(resolve(artifactDir, 'search/index.html'))

    const audit = auditArtifactSitemaps({
      ...siteConfig,
      sitemap: {
        ...siteConfig.sitemap,
        excludedPaths: ['/search'],
      },
    })

    expect(audit.issues).toContainEqual(
      expect.objectContaining({
        message: 'Excluded path leaked into sitemap output.',
        severity: 'error',
        url: 'https://example.com/search/',
      })
    )
  })
})
