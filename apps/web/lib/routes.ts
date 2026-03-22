/**
 * Application route constants
 * Use these constants instead of hardcoding routes in components
 */

export const routes = {
  home: '/',
  llmsTxt: '/llms.txt',
  website: {
    list: '/websites',
    detail: '/websites/[slug]',
    featured: '/websites',
    latest: '/websites?sort=latest',
    withCategory: '/websites?category=[category]'
  },
  category: {
    page: '/[category]'
  },
  about: '/about',
  favorites: '/favorites',
  docs: {
    list: '/docs',
    doc: '/docs/[slug]'
  },
  guides: {
    list: '/guides',
    guide: '/guides/[slug]'
  },
  faq: '/faq',
  news: '/news',
  privacy: '/privacy',
  cookies: '/cookies',
  projects: '/projects',
  search: '/search',
  submit: '/submit',
  terms: '/terms',
  rss: '/rss.xml'
} as const

type StaticRoutes =
  | 'home'
  | 'llmsTxt'
  | 'website.list'
  | 'website.featured'
  | 'website.latest'
  | 'about'
  | 'docs.list'
  | 'favorites'
  | 'guides.list'
  | 'faq'
  | 'news'
  | 'privacy'
  | 'cookies'
  | 'projects'
  | 'search'
  | 'submit'
  | 'terms'
  | 'rss'

type DynamicRoutes =
  | 'website.detail'
  | 'website.withCategory'
  | 'docs.doc'
  | 'guides.guide'
  | 'category.page'

type Routes = StaticRoutes | DynamicRoutes

type DynamicRouteParams = {
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
