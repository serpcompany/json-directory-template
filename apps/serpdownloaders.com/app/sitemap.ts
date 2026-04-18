import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { logger } from '@thedaviddias/logging'
import type { MetadataRoute } from 'next'
import { categories } from '@thedaviddias/web-core/categories'
import {
  getActiveCategories,
  hasFeaturedListings,
} from '@thedaviddias/web-core/category-navigation'
import { getWebsites } from '@/lib/content-loader'
import { getRoute } from '@thedaviddias/web-core/routes'
import { SITE_PUBLIC_URL } from '@thedaviddias/web-core/seo-config'
import { siteConfig } from '@thedaviddias/web-core/site-config'

export const dynamic = 'force-static'

function getStaticRouteSlugs(): string[] {
  return [
    ...(siteConfig.features.showProjects ? [stripLeadingSlash(getRoute('projects'))] : []),
    ...(siteConfig.features.showDocs ? [stripLeadingSlash(getRoute('docs.list'))] : []),
    siteConfig.listingRouteBasePath,
    ...(siteConfig.features.showGuides ? [stripLeadingSlash(getRoute('guides.list'))] : []),
    'about',
  ]
}

function stripLeadingSlash(value: string): string {
  return value.replace(/^\/+/, '')
}

function mapContentPageToPublicPath(page: string): string {
  if (page === 'docs/getting-started') {
    return stripLeadingSlash(getRoute('docs.list'))
  }

  if (page.startsWith('docs/')) {
    return stripLeadingSlash(getRoute('docs.doc', { slug: page.slice('docs/'.length) }))
  }

  if (page.startsWith('guides/')) {
    return stripLeadingSlash(getRoute('guides.guide', { slug: page.slice('guides/'.length) }))
  }

  return page
}

const buildDate = new Date()

function getContentPages(dir: string, baseDir = ''): string[] {
  const pages: string[] = []

  try {
    const items = readdirSync(dir)

    for (const item of items) {
      const fullPath = join(dir, item)
      const stat = statSync(fullPath)

      if (stat.isDirectory()) {
        if (
          !item.startsWith('_') &&
          !item.startsWith('.') &&
          item !== 'websites' &&
          item !== 'extension-updates'
        ) {
          pages.push(...getContentPages(fullPath, join(baseDir, item)))
        }
      } else if (item.endsWith('.mdx') && !item.startsWith('_')) {
        const pagePath =
          item === 'index.mdx' ? baseDir : join(baseDir, item.replace('.mdx', ''))
        pages.push(pagePath)
      }
    }
  } catch (error) {
    logger.error(`Error reading directory ${dir}:`, { data: error, tags: { type: 'page' } })
  }

  return pages
}

function getPriority(routePath: string): number {
  if (!routePath) {
    return 1
  }

  const categorySlug = routePath.startsWith('categories/')
    ? routePath.slice('categories/'.length)
    : routePath

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

  if (routePath.startsWith('posts/')) {
    return 0.8
  }

  if (routePath.startsWith('resources/')) {
    return 0.7
  }

  if (getStaticRouteSlugs().includes(routePath)) {
    return 0.9
  }

  return 0.5
}

function getStaticRoutes(baseUrl: string): MetadataRoute.Sitemap {
  return getStaticRouteSlugs().map(routePath => ({
    url: `${baseUrl}/${routePath}`,
    lastModified: buildDate,
    changeFrequency: 'weekly',
    priority: getPriority(routePath),
  }))
}

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: MetadataRoute.Sitemap = []
  const baseUrl = SITE_PUBLIC_URL
  const contentDir = join(process.cwd(), '../../packages/content/data')

  try {
    routes.push({
      url: baseUrl,
      lastModified: buildDate,
      changeFrequency: 'daily',
      priority: 1,
    })

    const websites = getWebsites()
    const activeCategories = getActiveCategories(websites)

    activeCategories.forEach(category => {
      const categoryPath = getRoute('category.page', { category: category.slug })
      routes.push({
        url: `${baseUrl}${categoryPath}`,
        lastModified: buildDate,
        changeFrequency: category.priority === 'high' ? 'daily' : 'weekly',
        priority: getPriority(stripLeadingSlash(categoryPath)),
      })
    })

    if (hasFeaturedListings(websites)) {
      const featuredPath = getRoute('category.page', { category: 'featured' })
      routes.push({
        url: `${baseUrl}${featuredPath}`,
        lastModified: buildDate,
        changeFrequency: 'daily',
        priority: getPriority(stripLeadingSlash(featuredPath)),
      })
    }

    routes.push(...getStaticRoutes(baseUrl))

    for (const website of websites) {
      routes.push({
        url: `${baseUrl}${getRoute('listing.detail', { slug: website.slug })}`,
        lastModified: new Date(website.publishedAt),
        changeFrequency: 'monthly',
        priority: 0.8,
      })
    }

    const pages = getContentPages(contentDir)
    for (const page of pages) {
      if (page.startsWith('u/')) {
        continue
      }
      if (!siteConfig.features.showDocs && (page === 'docs' || page.startsWith('docs/'))) {
        continue
      }
      if (!siteConfig.features.showGuides && (page === 'guides' || page.startsWith('guides/'))) {
        continue
      }
      if (page === 'docs/getting-started' && siteConfig.features.showDocs) {
        continue
      }

      const publicPagePath = mapContentPageToPublicPath(page)
      routes.push({
        url: `${baseUrl}/${publicPagePath}`,
        lastModified: buildDate,
        changeFrequency: 'weekly',
        priority: getPriority(publicPagePath),
      })
    }
  } catch (error) {
    logger.error('Error generating sitemap:', { data: error, tags: { type: 'page' } })
  }

  return routes
}
