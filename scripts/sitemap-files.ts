import { readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve, sep } from 'node:path'

export const SITEMAP_PAGE_SIZE = 10_000

type SitemapGroupName = 'categories' | 'listing' | 'pages'

type SitemapGroup = {
  name: SitemapGroupName
  paths: string[]
}

type WriteSplitSitemapsOptions = {
  baseUrl: string
  listingBasePath: string
  pageSize?: number
}

const EXCLUDED_SITEMAP_PATHS = new Set([
  '/404',
  '/account',
  '/cookies',
  '/favorites',
  '/login',
  '/news',
  '/privacy',
  '/search',
  '/submit',
  '/terms'
])

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '')
}

function normalizeArtifactPath(path: string): string {
  if (!path) {
    return '/'
  }

  const normalizedPath = path.replaceAll(sep, '/').replace(/^\/+|\/+$/g, '')
  return normalizedPath ? `/${normalizedPath}` : '/'
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function buildUrl(baseUrl: string, path: string): string {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl)
  return path === '/' ? `${normalizedBaseUrl}/` : `${normalizedBaseUrl}${path}`
}

function chunkPaths(paths: string[], pageSize: number): string[][] {
  const chunks: string[][] = []

  for (let index = 0; index < paths.length; index += pageSize) {
    chunks.push(paths.slice(index, index + pageSize))
  }

  return chunks
}

function buildUrlSetXml(baseUrl: string, paths: string[]): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...paths.map(path => `<url><loc>${escapeXml(buildUrl(baseUrl, path))}</loc></url>`),
    '</urlset>'
  ].join('')
}

function buildSitemapIndexXml(baseUrl: string, sitemapPaths: string[]): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...sitemapPaths.map(path => `<sitemap><loc>${escapeXml(buildUrl(baseUrl, path))}</loc></sitemap>`),
    '</sitemapindex>'
  ].join('')
}

function listArtifactRoutePaths(artifactDir: string, currentDir = artifactDir): string[] {
  const routePaths: string[] = []

  for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
    const entryPath = join(currentDir, entry.name)

    if (entry.isDirectory()) {
      routePaths.push(...listArtifactRoutePaths(artifactDir, entryPath))
      continue
    }

    if (entry.name === '404.html') {
      continue
    }

    if (entry.name !== 'index.html') {
      continue
    }

    const relativeDir = currentDir === artifactDir ? '' : currentDir.slice(artifactDir.length + 1)
    const publicPath = normalizeArtifactPath(relativeDir)

    if (EXCLUDED_SITEMAP_PATHS.has(publicPath)) {
      continue
    }

    routePaths.push(publicPath)
  }

  return routePaths
}

function sortPaths(paths: string[]): string[] {
  return [...new Set(paths)].sort((left, right) => {
    if (left === '/') return -1
    if (right === '/') return 1
    return left.localeCompare(right)
  })
}

function groupArtifactPaths(paths: string[], listingBasePath: string): SitemapGroup[] {
  const listingPrefix = `/${listingBasePath}`
  const pages: string[] = []
  const listing: string[] = []
  const categories: string[] = []

  for (const path of paths) {
    if (path === listingPrefix || path.startsWith(`${listingPrefix}/`)) {
      listing.push(path)
      continue
    }

    if (path.startsWith('/categories/')) {
      categories.push(path)
      continue
    }

    pages.push(path)
  }

  return [
    { name: 'pages', paths: sortPaths(pages) },
    { name: 'listing', paths: sortPaths(listing) },
    { name: 'categories', paths: sortPaths(categories) }
  ]
}

function writeGroupSitemaps(
  artifactDir: string,
  baseUrl: string,
  group: SitemapGroup,
  pageSize: number
): string | null {
  if (group.paths.length === 0) {
    return null
  }

  const pagePaths = chunkPaths(group.paths, pageSize)
  const sitemapIndexEntries: string[] = []

  pagePaths.forEach((paths, index) => {
    const fileName = `${group.name}-${index}.xml`
    writeFileSync(resolve(artifactDir, fileName), buildUrlSetXml(baseUrl, paths))
    sitemapIndexEntries.push(`/${fileName}`)
  })

  const indexFileName = `${group.name}-index.xml`
  writeFileSync(resolve(artifactDir, indexFileName), buildSitemapIndexXml(baseUrl, sitemapIndexEntries))

  return `/${indexFileName}`
}

export function writeSplitSitemaps(
  artifactDir: string,
  options: WriteSplitSitemapsOptions
): void {
  const pageSize = options.pageSize ?? SITEMAP_PAGE_SIZE
  const publicPaths = sortPaths(listArtifactRoutePaths(artifactDir))
  const groupedPaths = groupArtifactPaths(publicPaths, options.listingBasePath.replace(/^\/+|\/+$/g, ''))
  const sitemapIndexEntries = groupedPaths
    .map(group => writeGroupSitemaps(artifactDir, options.baseUrl, group, pageSize))
    .filter((entry): entry is string => entry !== null)

  const sitemapIndexXml = buildSitemapIndexXml(options.baseUrl, sitemapIndexEntries)

  writeFileSync(resolve(artifactDir, 'sitemap-index.xml'), sitemapIndexXml)
  writeFileSync(resolve(artifactDir, 'sitemap.xml'), sitemapIndexXml)
}
