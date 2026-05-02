import { siteConfig } from './site-config';

function normalizeBasePath(basePath: string): string {
  return basePath.replace(/^\/+|\/+$/g, '');
}

function buildRouteFromBase(basePath: string, pattern = ''): string {
  const normalizedBasePath = normalizeBasePath(basePath);
  const routeBasePath = `/${normalizedBasePath}`;

  if (!pattern) {
    return routeBasePath;
  }

  return `${routeBasePath}/${pattern}`;
}

function buildListingRoute(pattern = ''): string {
  return buildRouteFromBase(siteConfig.listingRouteBasePath, pattern);
}

function buildDocsRoute(pattern = ''): string {
  return buildRouteFromBase(siteConfig.docsRouteBasePath, pattern);
}

function buildNetworkRoute(pattern = ''): string {
  return buildRouteFromBase(siteConfig.networkRouteBasePath, pattern);
}

function buildBrandsRoute(pattern = ''): string {
  return buildRouteFromBase(siteConfig.brandsRouteBasePath, pattern);
}

export const routes = {
  home: '/',
  listing: {
    list: buildListingRoute(),
    detail: buildListingRoute('[slug]'),
    featured: buildListingRoute(),
    latest: `${buildListingRoute()}?sort=latest`,
    withCategory: `${buildListingRoute()}?category=[category]`,
  },
  website: {
    list: buildListingRoute(),
    detail: buildListingRoute('[slug]'),
    featured: buildListingRoute(),
    latest: `${buildListingRoute()}?sort=latest`,
    withCategory: `${buildListingRoute()}?category=[category]`,
  },
  category: {
    page: '/categories/[category]',
  },
  about: '/about',
  account: '/account',
  affiliateDisclosure: '/legal/affiliate-disclosure',
  brands: buildBrandsRoute(),
  favorites: '/favorites',
  docs: {
    list: buildDocsRoute(),
    doc: buildDocsRoute('[slug]'),
  },
  guides: {
    list: '/posts',
    guide: '/posts/[slug]',
  },
  news: '/news',
  privacy: '/legal/privacy',
  cookies: '/legal/cookies',
  dmca: '/legal/dmca',
  projects: buildNetworkRoute(),
  search: '/search',
  login: '/login',
  submit: '/submit',
  terms: '/legal/terms',
  rss: '/rss.xml',
} as const;

type StaticRoutes =
  | 'home'
  | 'account'
  | 'listing.list'
  | 'listing.featured'
  | 'listing.latest'
  | 'website.list'
  | 'website.featured'
  | 'website.latest'
  | 'about'
  | 'docs.list'
  | 'favorites'
  | 'affiliateDisclosure'
  | 'brands'
  | 'guides.list'
  | 'news'
  | 'privacy'
  | 'cookies'
  | 'dmca'
  | 'login'
  | 'projects'
  | 'search'
  | 'submit'
  | 'terms'
  | 'rss';

type DynamicRoutes =
  | 'listing.detail'
  | 'listing.withCategory'
  | 'website.detail'
  | 'website.withCategory'
  | 'docs.doc'
  | 'guides.guide'
  | 'category.page';

type Routes = StaticRoutes | DynamicRoutes;

type DynamicRouteParams = {
  'listing.detail': { slug: string };
  'listing.withCategory': { category: string };
  'website.detail': { slug: string };
  'website.withCategory': { category: string };
  'docs.doc': { slug: string };
  'guides.guide': { slug: string };
  'category.page': { category: string };
};

export function getRoute<T extends Routes>(
  route: T,
  params?: T extends keyof DynamicRouteParams ? DynamicRouteParams[T] : never
): string {
  const parts = route.split('.');
  let current: any = routes;

  for (const part of parts) {
    current = current[part];
  }

  if (typeof current === 'string' && params) {
    const param = Object.entries(params)[0];
    return current.replace(`[${param[0]}]`, param[1]);
  }

  return current;
}
