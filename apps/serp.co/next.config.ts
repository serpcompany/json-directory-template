import path from 'node:path'
import { withContentCollections } from '@content-collections/next'
import withMDX from '@next/mdx'
import { baseConfig, withAnalyzer } from '@thedaviddias/config-next'
import { defaultSiteConfig, resolveCheckedInSiteConfig } from '@thedaviddias/site-contract'
import { getSiteRootListingAliases } from '@thedaviddias/site-contract/site-root-listing-aliases'
import { categories } from '@thedaviddias/web-core/categories'
import type { NextConfig } from 'next'
import { isStaticExportBuild } from './lib/runtime-mode'

export const INTERNAL_PACKAGES = [
  '@thedaviddias/design-system',
  '@thedaviddias/config-next',
  '@thedaviddias/config-typescript',
  '@thedaviddias/content',
  '@thedaviddias/logging',
  '@thedaviddias/site-contract',
  '@thedaviddias/utils',
  '@thedaviddias/web-core'
]

function normalizeBasePath(basePath: string): string {
  return basePath.replace(/^\/+|\/+$/g, '')
}

function buildPublicRoute(basePath: string): string {
  return `/${normalizeBasePath(basePath)}`
}

function createAliasRewrites(sourceBasePath: string, destinationBasePath: string) {
  if (sourceBasePath === destinationBasePath) {
    return []
  }

  return [
    {
      source: buildPublicRoute(sourceBasePath),
      destination: buildPublicRoute(destinationBasePath)
    },
    {
      source: `${buildPublicRoute(sourceBasePath)}/:path*`,
      destination: `${buildPublicRoute(destinationBasePath)}/:path*`
    }
  ]
}

const categoryRouteSlugs = ['featured', ...categories.map(category => category.slug)]

function createLegacyCategoryRedirects() {
  return categoryRouteSlugs.map(slug => ({
    source: `/${slug}`,
    destination: `/categories/${slug}`,
    permanent: true
  }))
}

const runtimeSiteConfig = resolveCheckedInSiteConfig(
  process.env.NEXT_PUBLIC_SITE_ID || process.env.SITE_ID || defaultSiteConfig.id
)
const listingBasePath = normalizeBasePath(runtimeSiteConfig.routes.listingBasePath)
const docsBasePath = normalizeBasePath(runtimeSiteConfig.routes.docsBasePath)
const networkBasePath = normalizeBasePath(runtimeSiteConfig.routes.networkBasePath)
const brandsBasePath = normalizeBasePath(runtimeSiteConfig.routes.brandsBasePath)
const rootListingAliases = getSiteRootListingAliases(runtimeSiteConfig.id)

let nextConfig: NextConfig = {
  ...baseConfig,

  transpilePackages: INTERNAL_PACKAGES,

  pageExtensions: ['mdx', 'ts', 'tsx'],

  trailingSlash: true,

  // Configure logging behavior
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development'
    }
  },

  // Configure Turbopack (default bundler in Next.js 16)
  turbopack: {
    root: path.resolve(process.cwd(), '../..'),
    resolveExtensions: ['.mdx', '.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
    resolveAlias: {
      crypto: { browser: './turbopack-empty.ts' },
      stream: { browser: './turbopack-empty.ts' },
      buffer: { browser: './turbopack-empty.ts' },
      util: { browser: './turbopack-empty.ts' },
      fs: { browser: './turbopack-empty.ts' },
      path: { browser: './turbopack-empty.ts' },
      'node:crypto': { browser: './turbopack-empty.ts' },
      'node:stream': { browser: './turbopack-empty.ts' },
      'node:buffer': { browser: './turbopack-empty.ts' },
      'node:util': { browser: './turbopack-empty.ts' },
      'node:fs': { browser: './turbopack-empty.ts' },
      'node:path': { browser: './turbopack-empty.ts' }
    }
  },

  images: {
    unoptimized: isStaticExportBuild(),
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'icon.horse',
        pathname: '/icon/**'
      }
    ]
  },

  rewrites: async () => ({
    beforeFiles: [
      ...createAliasRewrites(docsBasePath, 'docs'),
      ...createAliasRewrites(networkBasePath, 'projects'),
      ...createAliasRewrites(brandsBasePath, 'brands'),
      ...createAliasRewrites('posts', 'guides')
    ]
  }),

  redirects: async () => {
    return [
      {
        source: '/news',
        destination: '/',
        permanent: false
      },
      ...rootListingAliases.map(slug => ({
        source: `/${slug}`,
        destination: `${buildPublicRoute(listingBasePath)}/${slug}/`,
        permanent: true
      })),
      {
        source: '/website/:path*',
        destination: `${buildPublicRoute(listingBasePath)}/:path*`,
        permanent: true
      },
      ...createAliasRewrites('websites', listingBasePath).map(rule => ({
        ...rule,
        permanent: true
      })),
      ...createAliasRewrites('docs', docsBasePath).map(rule => ({
        ...rule,
        permanent: true
      })),
      ...createAliasRewrites('projects', networkBasePath).map(rule => ({
        ...rule,
        permanent: true
      })),
      ...createAliasRewrites('brands', brandsBasePath).map(rule => ({
        ...rule,
        permanent: true
      })),
      ...createAliasRewrites('guides', 'posts').map(rule => ({
        ...rule,
        permanent: true
      })),
      ...createLegacyCategoryRedirects()
    ]
  }
}

if (isStaticExportBuild()) {
  nextConfig = {
    ...nextConfig,
    output: 'export'
  }
}

// Apply other plugins first
nextConfig = withMDX()(nextConfig)

if (process.env.ANALYZE === 'true') {
  nextConfig = withAnalyzer(nextConfig)
}

// withContentCollections must be the outermost wrapper
export default withContentCollections(nextConfig)
