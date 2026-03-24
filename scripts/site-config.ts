import { z } from 'zod'
import {
  defaultSiteConfig,
  resolveCheckedInSiteConfig,
  type CheckedInSiteConfig
} from '../sites/index.ts'
import { resolveDrBadgeConfig } from '../sites/types.ts'

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

const drBadgeSchema = z.union([
  z.object({
    alt: z.string().min(1).optional(),
    domain: z.string().min(1),
    provider: z.literal('serp-dr'),
    style: z.literal('serp-dr-v3').default('serp-dr-v3')
  }),
  z.object({
    alt: z.string().min(1),
    height: z.number().int().positive(),
    href: z.string().url(),
    imageSrc: z.string().url(),
    kind: z.literal('raw'),
    width: z.number().int().positive()
  })
])

const listingJsonSourceSchema = z.object({
  kind: z.literal('listing-json'),
  outputPath: z.string().min(1).default('data/websites.json'),
  path: z.string().min(1)
})

const trialProductsSourceSchema = z.object({
  category: z.string().min(1).default('automation-workflow'),
  featuredCount: z.number().int().nonnegative().default(6),
  kind: z.literal('trial-products-json'),
  outputPath: z.string().min(1).default('data/websites.json'),
  path: z.string().min(1),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
})

const siteCopyDefaults = defaultSiteConfig.copy

const siteCopySchema = z.object({
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
  showCreatorProjects: z.boolean().default(false),
  showDocs: z.boolean().default(false),
  showDeveloperTools: z.boolean().default(false),
  showFavorites: z.boolean().default(false),
  showFeaturedGuides: z.boolean().default(false),
  showGuides: z.boolean().default(false),
  showNewsletter: z.boolean().default(true),
  showProjects: z.boolean().default(false)
})

const checkedInSiteConfigSchema = z.object({
  branding: z.object({
    drBadge: drBadgeSchema,
    favicon: assetSourceSchema.optional(),
    logo: assetSourceSchema.optional(),
    opengraphImage: assetSourceSchema.optional()
  }),
  build: z.object({
    appOutDir: z.string().min(1).default('apps/web/out'),
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
      preserve: z
        .array(z.string().min(1))
        .default(['.github/workflows/deploy.yml', 'CNAME']),
      repoUrl: z.string().url(),
      strategy: z.literal('github-pages-repo-sync')
    })
    .optional(),
  features: featureFlagsSchema.default({}),
  id: z.string().min(1),
  routes: z.object({
    docsBasePath: z.string().regex(/^[a-z0-9-]+$/).default('docs'),
    listingBasePath: z.string().regex(/^[a-z0-9-]+$/).default('websites'),
    networkBasePath: z.string().regex(/^[a-z0-9-]+$/).default('network')
  }),
  site: z.object({
    description: z.string().min(1),
    domain: z.string().min(1),
    name: z.string().min(1),
    publicUrl: z.string().url(),
    tagline: z.string().min(1)
  }),
  social: z.object({
    githubIssueOwner: z.string().min(1),
    githubIssueRepo: z.string().min(1),
    githubIssueTemplate: z.string().min(1).default('submit-website.yml'),
    githubIssuesUrl: z.string().url(),
    githubRepoUrl: z.string().url(),
    githubUrl: z.string().url(),
    redditUrl: z.string().url(),
    twitterUrl: z.string().url()
  }),
  version: z.literal(1)
})

export type CheckedInSiteConfigRecord = z.infer<typeof checkedInSiteConfigSchema>
export type SiteInputTarget = {
  siteId?: string
}

export function parseSiteInputArgs(
  argv: string[],
  env: NodeJS.ProcessEnv = process.env
): SiteInputTarget {
  const siteFlagIndex = argv.findIndex(argument => argument === '--site')

  if (siteFlagIndex >= 0 && argv[siteFlagIndex + 1]) {
    return { siteId: argv[siteFlagIndex + 1] as string }
  }

  return {
    siteId: env.SITE_ID || env.NEXT_PUBLIC_SITE_ID || defaultSiteConfig.id
  }
}

export function loadCheckedInSite(siteId?: string): CheckedInSiteConfigRecord {
  return checkedInSiteConfigSchema.parse(resolveCheckedInSiteConfig(siteId))
}

export function loadCheckedInSiteFromInput(
  input: SiteInputTarget
): CheckedInSiteConfigRecord {
  return loadCheckedInSite(input.siteId)
}

export function buildSiteEnvironment(
  siteConfig: CheckedInSiteConfig
): Record<string, string> {
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

export function resolveSiteAppOutDir(siteConfig: CheckedInSiteConfig): string {
  return siteConfig.build.appOutDir
}

export function resolveResolvedSiteConfig(siteConfig: CheckedInSiteConfig) {
  return {
    copy: siteConfig.copy,
    description: siteConfig.site.description,
    docsRouteBasePath: siteConfig.routes.docsBasePath,
    domain: siteConfig.site.domain,
    drBadge: resolveDrBadgeConfig(siteConfig.branding.drBadge),
    features: siteConfig.features,
    githubIssueOwner: siteConfig.social.githubIssueOwner,
    githubIssueRepo: siteConfig.social.githubIssueRepo,
    githubIssueTemplate: siteConfig.social.githubIssueTemplate,
    githubIssuesUrl: siteConfig.social.githubIssuesUrl,
    githubRepoUrl: siteConfig.social.githubRepoUrl,
    githubUrl: siteConfig.social.githubUrl,
    id: siteConfig.id,
    listingRouteBasePath: siteConfig.routes.listingBasePath,
    name: siteConfig.site.name,
    networkRouteBasePath: siteConfig.routes.networkBasePath,
    publicUrl: siteConfig.site.publicUrl,
    redditUrl: siteConfig.social.redditUrl,
    tagline: siteConfig.site.tagline,
    twitterUrl: siteConfig.social.twitterUrl
  }
}
