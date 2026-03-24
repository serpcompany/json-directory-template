import path from 'node:path'
import { withContentCollections } from '@content-collections/next'
import withMDX from '@next/mdx'
import { baseConfig, withAnalyzer } from '@thedaviddias/config-next'
import type { NextConfig } from 'next'
import { defaultSiteConfig, resolveCheckedInSiteConfig } from '../../sites'
import { isStaticExportBuild } from './lib/runtime-mode'

export const INTERNAL_PACKAGES = [
  '@thedaviddias/design-system',
  '@thedaviddias/config-next',
  '@thedaviddias/config-typescript',
  '@thedaviddias/content',
  '@thedaviddias/logging',
  '@thedaviddias/utils'
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

const runtimeSiteConfig = resolveCheckedInSiteConfig(
  process.env.NEXT_PUBLIC_SITE_ID || process.env.SITE_ID || defaultSiteConfig.id
)
const listingBasePath = normalizeBasePath(runtimeSiteConfig.routes.listingBasePath)
const docsBasePath = normalizeBasePath(runtimeSiteConfig.routes.docsBasePath)
const networkBasePath = normalizeBasePath(runtimeSiteConfig.routes.networkBasePath)

let nextConfig: NextConfig = {
  ...baseConfig,

  transpilePackages: INTERNAL_PACKAGES,

  pageExtensions: ['mdx', 'ts', 'tsx'],

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
        hostname: 'www.google.com',
        pathname: '/s2/favicons/**'
      },
      {
        protocol: 'https',
        hostname: 't0.gstatic.com',
        pathname: '/faviconV2/**'
      },
      {
        protocol: 'https',
        hostname: 'icon.horse',
        pathname: '/icon/**'
      }
    ]
  },

  rewrites: async () => ({
    beforeFiles: [
      ...createAliasRewrites(listingBasePath, 'websites'),
      ...createAliasRewrites(docsBasePath, 'docs'),
      ...createAliasRewrites(networkBasePath, 'projects')
    ]
  }),

  redirects: async () => {
    return [
      {
        source: '/news',
        destination: '/',
        permanent: false
      },
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
      }))
    ]
  }
}

if (isStaticExportBuild()) {
  nextConfig = {
    ...nextConfig,
    output: 'export',
    trailingSlash: true
  }
}

// Apply other plugins first
nextConfig = withMDX()(nextConfig)

if (process.env.ANALYZE === 'true') {
  nextConfig = withAnalyzer(nextConfig)
}

// withContentCollections must be the outermost wrapper
export default withContentCollections(nextConfig)
