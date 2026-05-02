import type { MetadataRoute } from 'next'
import { NextResponse } from 'next/server'
import { categories } from './categories'
import {
  getActiveCategories,
  hasFeaturedListings,
} from './category-navigation'
import { getRoute } from './routes'
import { SITE_PUBLIC_URL } from './seo-config'
import { siteConfig } from './site-config'

type WebsiteSitemapEntry = {
  categories?: string[]
  category?: string
  featured?: boolean
  publishedAt: string
  slug: string
}

type DocSitemapEntry = {
  slug: string
}

type GuideSitemapEntry = {
  slug: string
}

type SitemapEntry = {
  loc: string
  lastmod?: string
}

type SitemapContentLoaders = {
  getDocs?: () => DocSitemapEntry[]
  getGuides?: () => GuideSitemapEntry[]
  getWebsites: () => WebsiteSitemapEntry[]
}

const CANONICAL_SITEMAP_INDEX_PATH = '/sitemap-index.xml'

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '')
}

function toAbsoluteUrl(path: string, baseUrl = SITE_PUBLIC_URL): string {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl)
  return path === '/' ? `${normalizedBaseUrl}/` : `${normalizedBaseUrl}${path}`
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function renderSitemap(entries: SitemapEntry[]): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map(entry => {
      const lastmod = entry.lastmod ? `<lastmod>${escapeXml(entry.lastmod)}</lastmod>` : ''
      return `<url><loc>${escapeXml(entry.loc)}</loc>${lastmod}</url>`
    }),
    '</urlset>',
  ].join('')
}

function renderSitemapIndex(entries: SitemapEntry[]): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map(entry => {
      const lastmod = entry.lastmod ? `<lastmod>${escapeXml(entry.lastmod)}</lastmod>` : ''
      return `<sitemap><loc>${escapeXml(entry.loc)}</loc>${lastmod}</sitemap>`
    }),
    '</sitemapindex>',
  ].join('')
}

function toXmlResponse(xml: string): Response {
  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
    },
  })
}

function sortUniquePaths(paths: string[]): string[] {
  return [...new Set(paths)].sort((left, right) => {
    if (left === '/') {
      return -1
    }

    if (right === '/') {
      return 1
    }

    return left.localeCompare(right)
  })
}

function getBuildDate(): string {
  return new Date().toISOString()
}

function getPriority(routePath: string): number {
  if (routePath === '/') {
    return 1
  }

  const normalizedPath = routePath.replace(/^\/+/, '')
  const categorySlug = normalizedPath.startsWith('categories/')
    ? normalizedPath.slice('categories/'.length)
    : normalizedPath

  if (categorySlug === 'featured') {
    return 0.9
  }

  const category = categories.find(entry => entry.slug === categorySlug)
  if (category) {
    if (category.priority === 'high') {
      return 0.9
    }

    if (category.priority === 'medium') {
      return 0.8
    }

    return 0.7
  }

  if (normalizedPath.startsWith('posts/')) {
    return 0.8
  }

  if (normalizedPath.startsWith('docs/')) {
    return 0.8
  }

  return 0.6
}

function buildUrlEntries(paths: string[], baseUrl = SITE_PUBLIC_URL): SitemapEntry[] {
  const buildDate = getBuildDate()

  return sortUniquePaths(paths).map(path => ({
    lastmod: buildDate,
    loc: toAbsoluteUrl(path, baseUrl),
  }))
}

function getStaticPagePaths(): string[] {
  return [
    '/',
    getRoute('about'),
    getRoute('affiliateDisclosure'),
    getRoute('privacy'),
    getRoute('cookies'),
    getRoute('dmca'),
    getRoute('terms'),
    ...(siteConfig.features.showBrands ? [getRoute('brands')] : []),
    ...(siteConfig.features.showProjects ? [getRoute('projects')] : []),
  ]
}

function getDocsPaths(getDocs: (() => DocSitemapEntry[]) | undefined): string[] {
  if (!siteConfig.features.showDocs || !getDocs) {
    return []
  }

  return [
    getRoute('docs.list'),
    ...getDocs().map(doc => getRoute('docs.doc', { slug: doc.slug })),
  ]
}

function getPostsPaths(getGuides: (() => GuideSitemapEntry[]) | undefined): string[] {
  if (!siteConfig.features.showGuides || !getGuides) {
    return []
  }

  return [
    getRoute('guides.list'),
    ...getGuides().map(guide => getRoute('guides.guide', { slug: guide.slug })),
  ]
}

function getListingPaths(getWebsites: () => WebsiteSitemapEntry[]): SitemapEntry[] {
  return getWebsites().map(website => ({
    lastmod: new Date(website.publishedAt).toISOString(),
    loc: toAbsoluteUrl(getRoute('listing.detail', { slug: website.slug })),
  }))
}

function getTaxonomyPaths(getWebsites: () => WebsiteSitemapEntry[]): string[] {
  const websites = getWebsites()
  const paths = [getRoute('listing.list')]
  const activeCategories = getActiveCategories(websites)

  for (const category of activeCategories) {
    paths.push(getRoute('category.page', { category: category.slug }))
  }

  if (hasFeaturedListings(websites)) {
    paths.push(getRoute('category.page', { category: 'featured' }))
  }

  return paths
}

function getIndexEntries(loaders: SitemapContentLoaders): SitemapEntry[] {
  const buildDate = getBuildDate()
  const entries: SitemapEntry[] = [
    {
      lastmod: buildDate,
      loc: toAbsoluteUrl('/pages-sitemap.xml'),
    },
    {
      lastmod: buildDate,
      loc: toAbsoluteUrl('/listings-sitemap.xml'),
    },
    {
      lastmod: buildDate,
      loc: toAbsoluteUrl('/taxonomies-sitemap.xml'),
    },
  ]

  if (getDocsPaths(loaders.getDocs).length > 0) {
    entries.push({
      lastmod: buildDate,
      loc: toAbsoluteUrl('/docs-sitemap.xml'),
    })
  }

  if (getPostsPaths(loaders.getGuides).length > 0) {
    entries.push({
      lastmod: buildDate,
      loc: toAbsoluteUrl('/posts-sitemap.xml'),
    })
  }

  return entries
}

export function createCanonicalRobots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/'],
      disallow: ['/404', '/500', '/submit', '/search'],
    },
    sitemap: toAbsoluteUrl(CANONICAL_SITEMAP_INDEX_PATH),
  }
}

export function createSitemapCompatibilityRedirect(): Response {
  return NextResponse.redirect(toAbsoluteUrl(CANONICAL_SITEMAP_INDEX_PATH), {
    status: 307,
  })
}

export function createSitemapIndexResponse(loaders: SitemapContentLoaders): Response {
  return toXmlResponse(renderSitemapIndex(getIndexEntries(loaders)))
}

export function createPagesSitemapResponse(): Response {
  return toXmlResponse(renderSitemap(buildUrlEntries(getStaticPagePaths())))
}

export function createListingsSitemapResponse(loaders: SitemapContentLoaders): Response {
  return toXmlResponse(renderSitemap(getListingPaths(loaders.getWebsites)))
}

export function createTaxonomiesSitemapResponse(loaders: SitemapContentLoaders): Response {
  return toXmlResponse(
    renderSitemap(buildUrlEntries(getTaxonomyPaths(loaders.getWebsites)))
  )
}

export function createDocsSitemapResponse(loaders: SitemapContentLoaders): Response {
  return toXmlResponse(renderSitemap(buildUrlEntries(getDocsPaths(loaders.getDocs))))
}

export function createPostsSitemapResponse(loaders: SitemapContentLoaders): Response {
  return toXmlResponse(
    renderSitemap(buildUrlEntries(getPostsPaths(loaders.getGuides)))
  )
}
