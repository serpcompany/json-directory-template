import { mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve, sep } from 'node:path'

export const SITEMAP_PAGE_SIZE = 10_000

type SitemapGroup = {
  key: 'docs' | 'listings' | 'pages' | 'posts' | 'taxonomies'
  name: string
  paths: string[]
}

type WriteSplitSitemapsOptions = {
  additionalPathsByGroup?: Partial<Record<SitemapGroup['key'], string[]>>
  baseUrl: string
  categoryBasePath?: string
  excludedPaths?: string[]
  listingDetailSuffix?: string
  listingBasePath: string
  pageSize?: number
  sitemapPathByGroup?: Partial<Record<SitemapGroup['key'], string>>
  staticPagePaths?: string[]
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

const DOCS_PREFIX = '/docs'
const POSTS_PREFIX = '/posts'

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

function withTrailingSlash(path: string): string {
  if (path === '/') {
    return path
  }

  if (path.endsWith('/') || path.split('/').at(-1)?.includes('.')) {
    return path
  }

  return `${path}/`
}

function buildUrl(
  baseUrl: string,
  path: string,
  options: { trailingSlash?: boolean } = {}
): string {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl)
  const normalizedPath = options.trailingSlash ? withTrailingSlash(path) : path
  return normalizedPath === '/'
    ? `${normalizedBaseUrl}/`
    : `${normalizedBaseUrl}${normalizedPath}`
}

function appendPathSegment(path: string, segment: string | undefined): string {
  if (!segment) {
    return path
  }

  const normalizedSegment = segment.replace(/^\/+|\/+$/g, '')

  if (!normalizedSegment) {
    return path
  }

  if (path.replace(/\/+$/g, '').endsWith(`/${normalizedSegment}`)) {
    return path
  }

  return `${path.replace(/\/+$/g, '')}/${normalizedSegment}`
}

function replacePathPrefix(path: string, fromPrefix: string, toPrefix: string): string {
  if (path === fromPrefix) {
    return toPrefix
  }

  if (!path.startsWith(`${fromPrefix}/`)) {
    return path
  }

  return `${toPrefix}${path.slice(fromPrefix.length)}`
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
    ...paths.map(path =>
      `<url><loc>${escapeXml(buildUrl(baseUrl, path, { trailingSlash: true }))}</loc></url>`
    ),
    '</urlset>'
  ].join('')
}

function buildSitemapIndexXml(baseUrl: string, sitemapPaths: string[]): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...sitemapPaths.map(path =>
      `<sitemap><loc>${escapeXml(buildUrl(baseUrl, path))}</loc></sitemap>`
    ),
    '</sitemapindex>'
  ].join('')
}

function listArtifactRoutePaths(
  artifactDir: string,
  currentDir = artifactDir,
  excludedPaths = new Set<string>(),
  includedPaths = new Set<string>()
): string[] {
  const routePaths: string[] = []

  for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
    const entryPath = join(currentDir, entry.name)

    if (entry.isDirectory()) {
      routePaths.push(
        ...listArtifactRoutePaths(artifactDir, entryPath, excludedPaths, includedPaths)
      )
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

    if (EXCLUDED_SITEMAP_PATHS.has(publicPath) && !includedPaths.has(publicPath)) {
      continue
    }

    if (excludedPaths.has(publicPath)) {
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

function groupArtifactPaths(
  paths: string[],
  options: {
    categoryBasePath?: string
    listingBasePath: string
    listingDetailSuffix?: string
    staticPagePaths?: string[]
  }
): SitemapGroup[] {
  const listingPrefix = `/${options.listingBasePath}`
  const categoryPrefix = '/categories'
  const categoryOutputPrefix = options.categoryBasePath
    ? `/${options.categoryBasePath.replace(/^\/+|\/+$/g, '')}`
    : categoryPrefix
  const staticPagePaths = options.staticPagePaths
    ? new Set(options.staticPagePaths.map(path => normalizeArtifactPath(path)))
    : null
  const pages: string[] = []
  const listings: string[] = []
  const taxonomies: string[] = []
  const docs: string[] = []
  const posts: string[] = []

  for (const path of paths) {
    if (staticPagePaths?.has(path)) {
      pages.push(path)
      continue
    }

    if (path === DOCS_PREFIX || path.startsWith(`${DOCS_PREFIX}/`)) {
      docs.push(path)
      continue
    }

    if (path === POSTS_PREFIX || path.startsWith(`${POSTS_PREFIX}/`)) {
      posts.push(path)
      continue
    }

    if (path === listingPrefix) {
      if (!staticPagePaths) {
        taxonomies.push(path)
      }
      continue
    }

    if (path.startsWith(`${listingPrefix}/`)) {
      listings.push(appendPathSegment(path, options.listingDetailSuffix))
      continue
    }

    if (path.startsWith(`${categoryPrefix}/`)) {
      taxonomies.push(replacePathPrefix(path, categoryPrefix, categoryOutputPrefix))
      continue
    }

    if (staticPagePaths && !staticPagePaths.has(path)) {
      continue
    }

    pages.push(path)
  }

  return [
    { key: 'pages', name: 'pages-sitemap', paths: sortPaths(pages) },
    { key: 'listings', name: 'listings-sitemap', paths: sortPaths(listings) },
    { key: 'taxonomies', name: 'taxonomies-sitemap', paths: sortPaths(taxonomies) },
    { key: 'docs', name: 'docs-sitemap', paths: sortPaths(docs) },
    { key: 'posts', name: 'posts-sitemap', paths: sortPaths(posts) },
  ]
}

function writeGroupSitemaps(
  artifactDir: string,
  baseUrl: string,
  group: SitemapGroup,
  pageSize: number,
  outputPath?: string
): string | null {
  if (group.paths.length === 0) {
    return null
  }

  if (outputPath) {
    const normalizedOutputPath = normalizeArtifactPath(outputPath)
    const outputFilePath = resolve(artifactDir, normalizedOutputPath.slice(1))
    mkdirSync(dirname(outputFilePath), { recursive: true })
    writeFileSync(outputFilePath, buildUrlSetXml(baseUrl, group.paths))
    return normalizedOutputPath
  }

  const pagePaths = chunkPaths(group.paths, pageSize)
  const sitemapIndexEntries: string[] = []

  pagePaths.forEach((paths, index) => {
    const fileName =
      pagePaths.length === 1 ? `${group.name}.xml` : `${group.name}-${index}.xml`
    writeFileSync(resolve(artifactDir, fileName), buildUrlSetXml(baseUrl, paths))
    sitemapIndexEntries.push(`/${fileName}`)
  })

  if (pagePaths.length === 1) {
    return sitemapIndexEntries[0] ?? null
  }

  const indexFileName = `${group.name}.xml`
  writeFileSync(
    resolve(artifactDir, indexFileName),
    buildSitemapIndexXml(baseUrl, sitemapIndexEntries)
  )

  return `/${indexFileName}`
}

export function writeSplitSitemaps(
  artifactDir: string,
  options: WriteSplitSitemapsOptions
): void {
  const pageSize = options.pageSize ?? SITEMAP_PAGE_SIZE
  const excludedPaths = new Set(
    (options.excludedPaths ?? []).map(path => normalizeArtifactPath(path))
  )
  const includedPaths = new Set(
    (options.staticPagePaths ?? []).map(path => normalizeArtifactPath(path))
  )
  const publicPaths = sortPaths(
    listArtifactRoutePaths(artifactDir, artifactDir, excludedPaths, includedPaths)
  )
  const groupedPaths = groupArtifactPaths(publicPaths, {
    categoryBasePath: options.categoryBasePath,
    listingBasePath: options.listingBasePath.replace(/^\/+|\/+$/g, ''),
    listingDetailSuffix: options.listingDetailSuffix,
    staticPagePaths: options.staticPagePaths,
  }).map(group => ({
    ...group,
    paths: sortPaths([
      ...group.paths,
      ...(options.additionalPathsByGroup?.[group.key] ?? []).map(path =>
        normalizeArtifactPath(path)
      ),
    ]).filter(path => !excludedPaths.has(path)),
  }))
  const sitemapIndexEntries = groupedPaths
    .map(group =>
      writeGroupSitemaps(
        artifactDir,
        options.baseUrl,
        group,
        pageSize,
        options.sitemapPathByGroup?.[group.key]
      )
    )
    .filter((entry): entry is string => entry !== null)

  const sitemapIndexXml = buildSitemapIndexXml(options.baseUrl, sitemapIndexEntries)

  writeFileSync(resolve(artifactDir, 'sitemap-index.xml'), sitemapIndexXml)
  writeFileSync(resolve(artifactDir, 'sitemap.xml'), sitemapIndexXml)
}
