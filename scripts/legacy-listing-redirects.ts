import { existsSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { resolveCheckedInSiteCategories } from '@thedaviddias/site-contract/categories'
import type { LegacyListingRedirect } from '@thedaviddias/site-contract/legacy-listing-slugs'
import { getSiteLegacyListingRedirects } from '@thedaviddias/site-contract/site-root-listing-aliases'
import type { CheckedInSiteConfigRecord } from './site-config.ts'

const workspaceRoot = resolve(process.cwd())

// Top-level paths the starter or a wrapper app owns even when the site does not serve them today,
// plus compatibility redirect sources configured in the wrapper `next.config.ts` files.
const STARTER_RESERVED_ROOT_SEGMENTS = [
  '404',
  '_next',
  'about',
  'account',
  'brands',
  'categories',
  'contact',
  'docs',
  'favorites',
  'featured',
  'guides',
  'legal',
  'listing',
  'login',
  'news',
  'operator',
  'posts',
  'pricing',
  'products',
  'projects',
  'search',
  'sitemaps',
  'sponsor',
  'submit',
  'tools',
  'website',
  'websites'
]

function firstSegment(path: string | undefined): string | undefined {
  return path?.replace(/^\/+|\/+$/g, '').split('/')[0] || undefined
}

// Next.js route directories and public files that become top-level URLs. Route groups such as
// `(legal)` do not add a segment, so their children are top-level routes too.
function listTopLevelRouteSegments(directory: string): string[] {
  if (!existsSync(directory)) {
    return []
  }

  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.isDirectory() && entry.name.startsWith('(') && entry.name.endsWith(')')) {
      return listTopLevelRouteSegments(resolve(directory, entry.name))
    }

    if (/^[_[@]/.test(entry.name)) {
      return []
    }

    return [entry.name]
  })
}

/**
 * Every top-level segment a legacy root redirect page (`/<legacy>/`) must not overwrite: configured
 * route base paths, sitemap paths, starter-owned routes, the wrapper app's route and public
 * entries, and the category slugs that the wrapper `next.config.ts` redirects from the root.
 */
export function getReservedRootRouteSegments(definition: CheckedInSiteConfigRecord): string[] {
  const appRoot = resolve(workspaceRoot, dirname(definition.build.appOutDir))
  const segments = [
    ...STARTER_RESERVED_ROOT_SEGMENTS,
    definition.routes.listingBasePath,
    definition.routes.docsBasePath,
    definition.routes.networkBasePath,
    definition.routes.brandsBasePath,
    definition.sitemap.categoryBasePath,
    definition.sitemap.featuredCategoryPath,
    ...(definition.sitemap.staticPagePaths ?? []),
    ...(definition.sitemap.excludedPaths ?? []),
    ...(definition.sitemap.artifactExcludedPaths ?? []),
    ...Object.values(definition.sitemap.pathByGroup ?? {}),
    ...listTopLevelRouteSegments(resolve(appRoot, 'app')),
    ...listTopLevelRouteSegments(resolve(appRoot, 'public')),
    ...resolveCheckedInSiteCategories(definition.id).map(category => category.slug)
  ]

  return [
    ...new Set(segments.map(firstSegment).filter((segment): segment is string => Boolean(segment)))
  ].sort()
}

export function resolveSiteLegacyListingRedirects(
  definition: CheckedInSiteConfigRecord
): LegacyListingRedirect[] {
  return getSiteLegacyListingRedirects(definition.id, {
    reservedRootSegments: getReservedRootRouteSegments(definition)
  })
}
