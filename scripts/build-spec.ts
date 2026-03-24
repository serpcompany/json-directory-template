import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { z } from 'zod'
import { loadSiteDefinition, type SiteDefinition } from './site-definition.ts'

const workspaceRoot = resolve(process.cwd())

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

const urlFieldSchema = z.string().url()
const textFieldSchema = z.string().min(1)
const domainFieldSchema = z.string().min(1)

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

const drBadgeProviderSchema = z.object({
  alt: textFieldSchema.optional(),
  domain: domainFieldSchema,
  provider: z.literal('serp-dr'),
  style: z.literal('serp-dr-v3').default('serp-dr-v3')
})

const drBadgeRawSchema = z.object({
  alt: textFieldSchema,
  height: z.number().int().positive(),
  href: urlFieldSchema,
  imageSrc: urlFieldSchema,
  kind: z.literal('raw'),
  width: z.number().int().positive()
})

const drBadgeSchema = z.union([drBadgeProviderSchema, drBadgeRawSchema])

const socialSchema = z.object({
  githubIssueOwner: textFieldSchema,
  githubIssueRepo: textFieldSchema,
  githubIssueTemplate: textFieldSchema.default('submit-website.yml'),
  githubIssuesUrl: urlFieldSchema,
  githubRepoUrl: urlFieldSchema,
  githubUrl: urlFieldSchema,
  redditUrl: urlFieldSchema,
  twitterUrl: urlFieldSchema
})

const brandingSchema = z.object({
  drBadge: drBadgeSchema,
  favicon: assetSourceSchema.optional(),
  logo: assetSourceSchema.optional(),
  opengraphImage: assetSourceSchema.optional()
})

const siteSchema = z.object({
  description: textFieldSchema,
  domain: domainFieldSchema,
  name: textFieldSchema,
  publicUrl: urlFieldSchema,
  tagline: textFieldSchema
})

const websiteJsonSourceSchema = z.object({
  kind: z.literal('website-json'),
  path: z.string().min(1)
})

const trialProductsSourceSchema = z.object({
  category: z.string().min(1).default('automation-workflow'),
  featuredCount: z.number().int().nonnegative().default(6),
  kind: z.literal('trial-products-json'),
  path: z.string().min(1),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
})

const deploySchema = z.object({
  branch: textFieldSchema.default('main'),
  preserve: z.array(textFieldSchema).default(['.github/workflows/deploy.yml', 'CNAME']),
  repoUrl: urlFieldSchema,
  strategy: z.literal('github-pages-repo-sync')
})

const buildSchema = z.object({
  artifactDir: textFieldSchema.optional(),
  mode: z.literal('static-directory').default('static-directory'),
  siteId: textFieldSchema
})

export const buildSpecSchema = z.object({
  branding: brandingSchema,
  build: buildSchema,
  content: z.object({
    websiteSource: z.union([websiteJsonSourceSchema, trialProductsSourceSchema])
  }),
  deploy: deploySchema.optional(),
  features: featureFlagsSchema.default({}),
  site: siteSchema,
  social: socialSchema,
  version: z.literal(1)
})

export type BuildSpec = z.infer<typeof buildSpecSchema>
export type BuildSpecFieldType = 'boolean' | 'enum' | 'file-reference' | 'free-text' | 'provider-payload' | 'url'

export const buildSpecFieldTypes: Record<string, BuildSpecFieldType> = {
  'branding.drBadge': 'provider-payload',
  'branding.favicon': 'file-reference',
  'branding.logo': 'file-reference',
  'branding.opengraphImage': 'file-reference',
  'build.artifactDir': 'free-text',
  'build.mode': 'enum',
  'build.siteId': 'free-text',
  'content.websiteSource.category': 'free-text',
  'content.websiteSource.featuredCount': 'free-text',
  'content.websiteSource.kind': 'enum',
  'content.websiteSource.path': 'file-reference',
  'content.websiteSource.publishedAt': 'free-text',
  'deploy.branch': 'free-text',
  'deploy.preserve': 'free-text',
  'deploy.repoUrl': 'url',
  'deploy.strategy': 'enum',
  'features.showAuth': 'boolean',
  'features.showCreatorProjects': 'boolean',
  'features.showDocs': 'boolean',
  'features.showDeveloperTools': 'boolean',
  'features.showFavorites': 'boolean',
  'features.showFeaturedGuides': 'boolean',
  'features.showGuides': 'boolean',
  'features.showNewsletter': 'boolean',
  'features.showProjects': 'boolean',
  'site.description': 'free-text',
  'site.domain': 'free-text',
  'site.name': 'free-text',
  'site.publicUrl': 'url',
  'site.tagline': 'free-text',
  'social.githubIssueOwner': 'free-text',
  'social.githubIssueRepo': 'free-text',
  'social.githubIssueTemplate': 'free-text',
  'social.githubIssuesUrl': 'url',
  'social.githubRepoUrl': 'url',
  'social.githubUrl': 'url',
  'social.redditUrl': 'url',
  'social.twitterUrl': 'url',
  version: 'enum'
}

export interface BuildInputTarget {
  siteId?: string
  specPath?: string
}

export function parseBuildInputArgs(
  argv: string[],
  env: NodeJS.ProcessEnv = process.env
): BuildInputTarget {
  const specFlagIndex = argv.findIndex(argument => argument === '--spec')

  if (specFlagIndex >= 0 && argv[specFlagIndex + 1]) {
    return { specPath: argv[specFlagIndex + 1] as string }
  }

  const siteFlagIndex = argv.findIndex(argument => argument === '--site')

  if (siteFlagIndex >= 0 && argv[siteFlagIndex + 1]) {
    return { siteId: argv[siteFlagIndex + 1] as string }
  }

  if (env.BUILD_SPEC_PATH) {
    return { specPath: env.BUILD_SPEC_PATH }
  }

  return {
    siteId: env.SITE_ID || 'serpdownloaders'
  }
}

export function resolveBuildSpecPath(specPath: string): string {
  return resolve(workspaceRoot, specPath)
}

export function loadBuildSpec(specPath: string): BuildSpec {
  const resolvedSpecPath = resolveBuildSpecPath(specPath)
  const raw = JSON.parse(readFileSync(resolvedSpecPath, 'utf8')) as unknown

  return buildSpecSchema.parse(raw)
}

function collectPlaceholderIssues(value: unknown, path: string[] = []): string[] {
  if (typeof value === 'string') {
    if (value.trim().startsWith('TODO')) {
      return [path.join('.') || 'root']
    }

    return []
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectPlaceholderIssues(item, [...path, String(index)]))
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, nestedValue]) =>
      collectPlaceholderIssues(nestedValue, [...path, key])
    )
  }

  return []
}

export function validateBuildSpecCompleteness(spec: BuildSpec): void {
  const placeholderIssues = collectPlaceholderIssues(spec)

  if (placeholderIssues.length > 0) {
    throw new Error(
      `Build spec is incomplete. Replace placeholder values before building:\n${placeholderIssues.map(issue => `- ${issue}`).join('\n')}`
    )
  }
}

export function validateBuildSpecReferences(spec: BuildSpec): void {
  const localAssetPaths = [
    spec.branding.favicon,
    spec.branding.logo,
    spec.branding.opengraphImage
  ].filter(asset => asset?.source === 'local-path')

  for (const asset of localAssetPaths) {
    const assetPath = resolve(workspaceRoot, asset.path)

    if (!existsSync(assetPath)) {
      throw new Error(`Missing required local asset referenced by build spec: ${asset.path}`)
    }
  }

  const websiteSource = spec.content.websiteSource
  const sourcePath = resolve(workspaceRoot, websiteSource.path)

  if (!existsSync(sourcePath)) {
    throw new Error(`Missing required content source referenced by build spec: ${websiteSource.path}`)
  }
}

function resolveDrBadge(badge: BuildSpec['branding']['drBadge']) {
  if ('provider' in badge) {
    return {
      alt: badge.alt || `Verified DR badge for ${badge.domain}`,
      height: 50,
      href: 'https://dr.serp.co/',
      imageSrc: `https://dr.serp.co/badge/${badge.domain}?style=${badge.style}`,
      width: 200
    }
  }

  return {
    alt: badge.alt,
    height: badge.height,
    href: badge.href,
    imageSrc: badge.imageSrc,
    width: badge.width
  }
}

export function buildSiteDefinitionFromBuildSpec(spec: BuildSpec): SiteDefinition {
  const drBadge = resolveDrBadge(spec.branding.drBadge)

  return {
    build: {
      appOutDir: 'apps/web/out',
      artifactDir: spec.build.artifactDir || `dist/sites/${spec.build.siteId}`
    },
    deploy: spec.deploy
      ? {
          branch: spec.deploy.branch,
          preserve: spec.deploy.preserve,
          repoUrl: spec.deploy.repoUrl,
          strategy: spec.deploy.strategy
        }
      : undefined,
    id: spec.build.siteId,
    site: {
      description: spec.site.description,
      domain: spec.site.domain,
      drBadge,
      features: spec.features,
      githubIssueOwner: spec.social.githubIssueOwner,
      githubIssueRepo: spec.social.githubIssueRepo,
      githubIssueTemplate: spec.social.githubIssueTemplate,
      githubIssuesUrl: spec.social.githubIssuesUrl,
      githubRepoUrl: spec.social.githubRepoUrl,
      githubUrl: spec.social.githubUrl,
      name: spec.site.name,
      publicUrl: spec.site.publicUrl,
      redditUrl: spec.social.redditUrl,
      tagline: spec.site.tagline,
      twitterUrl: spec.social.twitterUrl
    },
    source:
      spec.content.websiteSource.kind === 'trial-products-json'
        ? {
            category: spec.content.websiteSource.category,
            featuredCount: spec.content.websiteSource.featuredCount,
            kind: 'trial-products-json',
            outputPath: 'data/websites.json',
            path: spec.content.websiteSource.path,
            publishedAt: spec.content.websiteSource.publishedAt
          }
        : {
            kind: 'website-json',
            outputPath: 'data/websites.json',
            path: spec.content.websiteSource.path
          }
  }
}

export function loadBuildSpecFromInput(input: BuildInputTarget): BuildSpec | null {
  if (!input.specPath) {
    return null
  }

  const spec = loadBuildSpec(input.specPath)
  validateBuildSpecCompleteness(spec)
  validateBuildSpecReferences(spec)

  return spec
}

export function loadSiteDefinitionFromInput(input: BuildInputTarget): SiteDefinition {
  const spec = loadBuildSpecFromInput(input)

  if (spec) {
    return buildSiteDefinitionFromBuildSpec(spec)
  }

  return loadSiteDefinition(input.siteId || 'serpdownloaders')
}
