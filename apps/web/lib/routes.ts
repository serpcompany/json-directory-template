/**
 * Application route constants
 * Use these constants instead of hardcoding routes in components
 */
import { siteConfig } from '@/lib/site-config'

function getListingBasePath(): string {
  return `/${siteConfig.listingRouteBasePath}`
}

function buildListingRoute(pattern = ''): string {
  const basePath = getListingBasePath()

  if (!pattern) {
    return basePath
  }

  return `${basePath}/${pattern}`
}

export const routes = {
  home: '/',
  llmsTxt: '/llms.txt',
  listing: {
    list: buildListingRoute(),
    detail: buildListingRoute('[slug]'),
    featured: buildListingRoute(),
    latest: `${buildListingRoute()}?sort=latest`,
    withCategory: `${buildListingRoute()}?category=[category]`
  },
  website: {
    list: buildListingRoute(),
    detail: buildListingRoute('[slug]'),
    featured: buildListingRoute(),
    latest: `${buildListingRoute()}?sort=latest`,
    withCategory: `${buildListingRoute()}?category=[category]`
  },
  category: {
    page: '/[category]'
  },
  about: '/about',
  account: '/account',
  favorites: '/favorites',
  docs: {
    list: '/docs',
    doc: '/docs/[slug]'
  },
  guides: {
    list: '/guides',
    guide: '/guides/[slug]'
  },
  news: '/news',
  privacy: '/legal/privacy',
  cookies: '/legal/cookies',
  projects: '/projects',
  search: '/search',
  login: '/login',
  submit: '/submit',
  terms: '/legal/terms',
  rss: '/rss.xml'
} as const

type StaticRoutes =
  | 'home'
  | 'account'
  | 'llmsTxt'
  | 'listing.list'
  | 'listing.featured'
  | 'listing.latest'
  | 'website.list'
  | 'website.featured'
  | 'website.latest'
  | 'about'
  | 'docs.list'
  | 'favorites'
  | 'guides.list'
  | 'news'
  | 'privacy'
  | 'cookies'
  | 'login'
  | 'projects'
  | 'search'
  | 'submit'
  | 'terms'
  | 'rss'

type DynamicRoutes =
  | 'listing.detail'
  | 'listing.withCategory'
  | 'website.detail'
  | 'website.withCategory'
  | 'docs.doc'
  | 'guides.guide'
  | 'category.page'

type Routes = StaticRoutes | DynamicRoutes

type DynamicRouteParams = {
  'listing.detail': { slug: string }
  'listing.withCategory': { category: string }
  'website.detail': { slug: string }
  'website.withCategory': { category: string }
  'docs.doc': { slug: string }
  'guides.guide': { slug: string }
  'category.page': { category: string }
}

/**
 * Get the URL for a route
 * @param route - Route name
 * @param params - Route parameters (for dynamic routes)
 */
export function getRoute<T extends Routes>(
  route: T,
  params?: T extends keyof DynamicRouteParams ? DynamicRouteParams[T] : never
): string {
  const parts = route.split('.')
  let current: any = routes

  for (const part of parts) {
    current = current[part]
  }

  if (typeof current === 'string' && params) {
    const param = Object.entries(params)[0]
    return current.replace(`[${param[0]}]`, param[1])
  }

  return current
}
