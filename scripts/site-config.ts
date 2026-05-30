import {
  DEFAULT_STARTER_APP_OUT_DIR,
  DEFAULT_STARTER_APP_PACKAGE_NAME,
  defaultSiteConfig,
  resolveCheckedInSiteConfig
} from '@thedaviddias/site-contract'
import type { CheckedInSiteConfig } from '@thedaviddias/site-contract/types'
import { z } from 'zod'

const reservedPublicRouteBasePaths = {
  categories: 'Public category pages always use /categories/[slug].',
  pages: 'The app reserves /pages-sitemap.xml for the static pages sitemap family.',
  'pages-sitemap': 'The app reserves /pages-sitemap.xml for the static pages sitemap.',
  'listings-sitemap': 'The app reserves /listings-sitemap.xml for listing detail URLs.',
  'taxonomies-sitemap':
    'The app reserves /taxonomies-sitemap.xml for listing index and category URLs.',
  'docs-sitemap': 'The app reserves /docs-sitemap.xml for docs URLs.',
  'posts-sitemap': 'The app reserves /posts-sitemap.xml for post URLs.',
  sitemap:
    'The static sitemap generator reserves sitemap-index.xml for the top-level sitemap index.',
  posts: 'Public editorial posts always use /posts/[slug] when enabled.',
  tools: '/tools is reserved for future first-party tool pages.'
} as const

function normalizePublicRouteBasePath(basePath: string): string {
  return basePath.replace(/^\/+|\/+$/g, '')
}

const assetSourceSchema = z.union([
  z.object({
    path: z.string().min(1),
    source: z.literal('local-path')
  }),
  z.object({
    source: z.literal('url'),
    url: z.string().url()
  })
])

const siteAnalyticsSchema = z
  .object({
    gtmId: z
      .string()
      .regex(/^GTM-[A-Z0-9]+$/)
      .optional()
  })
  .optional()

const badgeObjectKeySchema = z
  .string()
  .min(1)
  .regex(/^(?!\/)(?!.*\.\.)(?:[a-z0-9._-]+\/)*[a-z0-9._-]+\.svg$/)

const siteBadgesSchema = z
  .object({
    featuredOn: z
      .object({
        dark: badgeObjectKeySchema.optional(),
        displayName: z.string().min(1).optional(),
        light: badgeObjectKeySchema.optional()
      })
      .optional()
  })
  .optional()

const listingJsonSourceSchema = z.object({
  kind: z.literal('listing-json'),
  outputPath: z.string().min(1).default('data/listings.json'),
  path: z.string().min(1)
})

const trialProductsSourceSchema = z.object({
  category: z.string().min(1).default('automation-workflow'),
  featuredCount: z.number().int().nonnegative().default(6),
  kind: z.literal('trial-products-json'),
  outputPath: z.string().min(1).default('data/listings.json'),
  path: z.string().min(1),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
})

const siteCopyDefaults = defaultSiteConfig.copy

const siteCopySchema = z.object({
  brandsLabel: z.string().min(1).default(siteCopyDefaults.brandsLabel),
  categoryLabels: z.record(z.string().min(1)).default(siteCopyDefaults.categoryLabels),
  docsLabel: z.string().min(1).default(siteCopyDefaults.docsLabel),
  listingName: z
    .object({
      plural: z.string().min(1).default(siteCopyDefaults.listingName.plural),
      singular: z.string().min(1).default(siteCopyDefaults.listingName.singular)
    })
    .default(siteCopyDefaults.listingName),
  networkLabel: z.string().min(1).default(siteCopyDefaults.networkLabel),
  submitLabel: z.string().min(1).default(siteCopyDefaults.submitLabel)
})

const featureFlagsSchema = z.object({
  showAuth: z.boolean().default(false),
  showBrands: z.boolean().default(true),
  showCreatorProjects: z.boolean().default(false),
  showDocs: z.boolean().default(false),
  showExternalResources: z.boolean().default(false),
  showFavorites: z.boolean().default(false),
  showFeaturedGuides: z.boolean().default(false),
  showGuides: z.boolean().default(false),
  showNewsletter: z.boolean().default(true),
  showProjects: z.boolean().default(false)
})

const sitemapGroupPathSchema = z.string().regex(/^\/?[a-z0-9-]+(?:\/[a-z0-9-]+)*\.xml$/)

function normalizeSitemapPath(path: string): string {
  return `/${path.replace(/^\/+|\/+$/g, '')}`
}

const sitemapConfigSchema = z
  .object({
    additionalPathsByGroup: z
      .object({
        docs: z.array(z.string().regex(/^\/(?:[a-z0-9-]+\/?)*$/)).optional(),
        listings: z.array(z.string().regex(/^\/(?:[a-z0-9-]+\/?)*$/)).optional(),
        pages: z.array(z.string().regex(/^\/(?:[a-z0-9-]+\/?)*$/)).optional(),
        posts: z.array(z.string().regex(/^\/(?:[a-z0-9-]+\/?)*$/)).optional(),
        taxonomies: z.array(z.string().regex(/^\/(?:[a-z0-9-]+\/?)*$/)).optional()
      })
      .default({}),
    artifactExcludedPaths: z.array(z.string().regex(/^\/(?:[a-z0-9-]+\/?)*$/)).optional(),
    categoryBasePath: z
      .string()
      .regex(/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/)
      .optional(),
    excludedPaths: z.array(z.string().regex(/^\/(?:[a-z0-9-]+\/?)*$/)).optional(),
    indexGroupOrder: z
      .array(z.enum(['docs', 'listings', 'pages', 'posts', 'taxonomies']))
      .optional(),
    listingDetailSuffix: z
      .string()
      .regex(/^[a-z0-9-]+$/)
      .optional(),
    pathByGroup: z
      .object({
        docs: sitemapGroupPathSchema.optional(),
        listings: sitemapGroupPathSchema.optional(),
        pages: sitemapGroupPathSchema.optional(),
        posts: sitemapGroupPathSchema.optional(),
        taxonomies: sitemapGroupPathSchema.optional()
      })
      .default({}),
    staticPagePaths: z.array(z.string().regex(/^\/(?:[a-z0-9-]+\/?)*$/)).optional()
  })
  .superRefine((sitemap, ctx) => {
    const reservedSitemapOutputPaths = new Set(['/sitemap-index.xml', '/sitemap.xml'])
    const seenOutputPaths = new Map<string, string>()

    for (const [group, path] of Object.entries(sitemap.pathByGroup ?? {})) {
      if (!path) {
        continue
      }

      const normalizedPath = normalizeSitemapPath(path)
      if (reservedSitemapOutputPaths.has(normalizedPath)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `sitemap.pathByGroup.${group} cannot use reserved sitemap output path "${normalizedPath}".`,
          path: ['pathByGroup', group]
        })
      }

      const previousGroup = seenOutputPaths.get(normalizedPath)
      if (previousGroup) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `sitemap.pathByGroup.${group} cannot reuse "${normalizedPath}" because sitemap.pathByGroup.${previousGroup} already uses it.`,
          path: ['pathByGroup', group]
        })
        continue
      }

      seenOutputPaths.set(normalizedPath, group)
    }

    const excludedPaths = new Set(
      [...(sitemap.excludedPaths ?? []), ...(sitemap.artifactExcludedPaths ?? [])].map(path =>
        normalizeSitemapPath(path)
      )
    )
    const excludedStaticPagePaths = (sitemap.staticPagePaths ?? [])
      .map(path => normalizeSitemapPath(path))
      .filter(path => excludedPaths.has(path))

    if (excludedStaticPagePaths.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `sitemap.staticPagePaths cannot also be excluded: ${excludedStaticPagePaths.join(', ')}.`,
        path: ['staticPagePaths']
      })
    }
  })
  .default({})

const socialConfigSchema = z
  .object({
    githubIssueOwner: z.string().min(1).nullable(),
    githubIssueRepo: z.string().min(1).nullable(),
    githubIssuesUrl: z.string().url().nullable(),
    githubRepoUrl: z.string().url(),
    githubUrl: z.string().url(),
    redditUrl: z.string().url(),
    twitterUrl: z.string().url()
  })
  .superRefine((social, ctx) => {
    const issueFields = [
      ['githubIssueOwner', social.githubIssueOwner],
      ['githubIssueRepo', social.githubIssueRepo],
      ['githubIssuesUrl', social.githubIssuesUrl]
    ] as const
    const configuredCount = issueFields.filter(([, value]) => value !== null).length

    if (configuredCount === 0 || configuredCount === issueFields.length) {
      return
    }

    for (const [fieldName, value] of issueFields) {
      if (value === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'GitHub issue target fields must either all be configured or all be null.',
          path: [fieldName]
        })
      }
    }
  })

const checkedInSiteConfigSchema = z.object({
  analytics: siteAnalyticsSchema,
  badges: siteBadgesSchema,
  branding: z.object({
    favicon: assetSourceSchema.optional(),
    logo: assetSourceSchema.optional(),
    opengraphImage: assetSourceSchema.optional()
  }),
  build: z.object({
    appPackageName: z.string().min(1).default(DEFAULT_STARTER_APP_PACKAGE_NAME),
    appOutDir: z.string().min(1).default(DEFAULT_STARTER_APP_OUT_DIR),
    artifactDir: z.string().min(1),
    mode: z.literal('static-directory').default('static-directory')
  }),
  copy: siteCopySchema.default(siteCopyDefaults),
  content: z.object({
    listingSource: z.union([listingJsonSourceSchema, trialProductsSourceSchema])
  }),
  deploy: z
    .object({
      branch: z.string().min(1).default('main'),
      preserve: z.array(z.string().min(1)).default(['.github/workflows/deploy.yml', 'CNAME']),
      repoUrl: z.string().url(),
      strategy: z.literal('github-pages-repo-sync')
    })
    .optional(),
  features: featureFlagsSchema.default({}),
  id: z.string().min(1),
  networkBrandGroup: z.string().min(1).nullable().default(null),
  routes: z
    .object({
      brandsBasePath: z
        .string()
        .regex(/^[a-z0-9-]+$/)
        .default('brands'),
      docsBasePath: z
        .string()
        .regex(/^[a-z0-9-]+$/)
        .default('docs'),
      listingBasePath: z
        .string()
        .regex(/^[a-z0-9-]+$/)
        .default('listing'),
      networkBasePath: z
        .string()
        .regex(/^[a-z0-9-]+$/)
        .default('network')
    })
    .superRefine((routes, ctx) => {
      const routeFields = [
        ['docsBasePath', normalizePublicRouteBasePath(routes.docsBasePath)],
        ['listingBasePath', normalizePublicRouteBasePath(routes.listingBasePath)],
        ['networkBasePath', normalizePublicRouteBasePath(routes.networkBasePath)],
        ['brandsBasePath', normalizePublicRouteBasePath(routes.brandsBasePath)]
      ] as const

      const seenRouteFields = new Map<string, (typeof routeFields)[number][0]>()

      for (const [fieldName, fieldValue] of routeFields) {
        const reservedMessage =
          reservedPublicRouteBasePaths[fieldValue as keyof typeof reservedPublicRouteBasePaths]

        if (reservedMessage) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `routes.${fieldName} cannot use "${fieldValue}". ${reservedMessage}`,
            path: [fieldName]
          })
        }

        const existingField = seenRouteFields.get(fieldValue)

        if (existingField) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `routes.${fieldName} cannot reuse "${fieldValue}" because routes.${existingField} already uses it.`,
            path: [fieldName]
          })
          continue
        }

        seenRouteFields.set(fieldValue, fieldName)
      }
    }),
  site: z.object({
    description: z.string().min(1),
    domain: z.string().min(1),
    name: z.string().min(1),
    publicUrl: z.string().url(),
    tagline: z.string().min(1)
  }),
  sitemap: sitemapConfigSchema,
  social: socialConfigSchema,
  version: z.literal(1)
})

export type CheckedInSiteConfigRecord = z.infer<typeof checkedInSiteConfigSchema>
export type SiteInputTarget = {
  siteId?: string
}

export function validateCheckedInSiteConfig(
  siteConfig: CheckedInSiteConfig
): CheckedInSiteConfigRecord {
  return checkedInSiteConfigSchema.parse(siteConfig)
}

export function parseSiteInputArgs(
  argv: string[],
  env: NodeJS.ProcessEnv = process.env
): SiteInputTarget {
  const siteFlagIndex = argv.indexOf('--site')

  if (siteFlagIndex >= 0 && argv[siteFlagIndex + 1]) {
    return { siteId: argv[siteFlagIndex + 1] as string }
  }

  return {
    siteId: env.SITE_ID || env.NEXT_PUBLIC_SITE_ID || defaultSiteConfig.id
  }
}

export function loadCheckedInSite(siteId?: string): CheckedInSiteConfigRecord {
  return validateCheckedInSiteConfig(resolveCheckedInSiteConfig(siteId))
}

export function loadCheckedInSiteFromInput(input: SiteInputTarget): CheckedInSiteConfigRecord {
  return loadCheckedInSite(input.siteId)
}

export function buildSiteEnvironment(siteConfig: CheckedInSiteConfig): Record<string, string> {
  return {
    LISTING_ROUTE_BASE_PATH: siteConfig.routes.listingBasePath,
    NEXT_PUBLIC_LISTING_ROUTE_BASE_PATH: siteConfig.routes.listingBasePath,
    NEXT_PUBLIC_SITE_ID: siteConfig.id,
    SITE_ID: siteConfig.id
  }
}

export function resolveSiteArtifactDir(siteConfig: CheckedInSiteConfig): string {
  return siteConfig.build.artifactDir
}

export function resolveSiteAppPackageName(siteConfig: CheckedInSiteConfig): string {
  return siteConfig.build.appPackageName
}

export function resolveSiteAppOutDir(siteConfig: CheckedInSiteConfig): string {
  return siteConfig.build.appOutDir
}

export function resolveResolvedSiteConfig(siteConfig: CheckedInSiteConfig) {
  return {
    copy: siteConfig.copy,
    brandsRouteBasePath: siteConfig.routes.brandsBasePath,
    description: siteConfig.site.description,
    docsRouteBasePath: siteConfig.routes.docsBasePath,
    domain: siteConfig.site.domain,
    features: siteConfig.features,
    gtmId: siteConfig.analytics?.gtmId,
    githubIssueOwner: siteConfig.social.githubIssueOwner,
    githubIssueRepo: siteConfig.social.githubIssueRepo,
    githubIssuesUrl: siteConfig.social.githubIssuesUrl,
    githubRepoUrl: siteConfig.social.githubRepoUrl,
    githubUrl: siteConfig.social.githubUrl,
    id: siteConfig.id,
    listingRouteBasePath: siteConfig.routes.listingBasePath,
    name: siteConfig.site.name,
    networkBrandGroup: siteConfig.networkBrandGroup,
    networkRouteBasePath: siteConfig.routes.networkBasePath,
    publicUrl: siteConfig.site.publicUrl,
    redditUrl: siteConfig.social.redditUrl,
    sitemap: siteConfig.sitemap,
    tagline: siteConfig.site.tagline,
    twitterUrl: siteConfig.social.twitterUrl
  }
}
