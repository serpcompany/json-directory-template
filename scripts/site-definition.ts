import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { z } from 'zod'

const drBadgeSchema = z.object({
  alt: z.string().min(1),
  height: z.number().int().positive(),
  href: z.string().url(),
  imageSrc: z.string().url(),
  width: z.number().int().positive()
})

const siteFeaturesSchema = z.object({
  showCreatorProjects: z.boolean().default(false),
  showDeveloperTools: z.boolean().default(false),
  showFeaturedGuides: z.boolean().default(false),
  showNewsletter: z.boolean().default(true)
})

const siteSurfaceSchema = z.object({
  description: z.string().min(1),
  domain: z.string().min(1),
  drBadge: drBadgeSchema,
  features: siteFeaturesSchema.default({}),
  githubIssueOwner: z.string().min(1),
  githubIssueRepo: z.string().min(1),
  githubIssueTemplate: z.string().min(1).default('submit-website.yml'),
  githubIssuesUrl: z.string().url(),
  githubRepoUrl: z.string().url(),
  githubUrl: z.string().url(),
  name: z.string().min(1),
  publicUrl: z.string().url().optional(),
  redditUrl: z.string().url(),
  tagline: z.string().min(1),
  twitterUrl: z.string().url()
})

const websiteJsonSourceSchema = z.object({
  kind: z.literal('website-json'),
  outputPath: z.string().min(1).default('data/websites.json'),
  path: z.string().min(1)
})

const trialProductsSourceSchema = z.object({
  category: z.string().min(1).default('automation-workflow'),
  featuredCount: z.number().int().nonnegative().default(6),
  kind: z.literal('trial-products-json'),
  outputPath: z.string().min(1).default('data/websites.json'),
  path: z.string().min(1),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default(new Date().toISOString().slice(0, 10))
})

const buildSchema = z.object({
  artifactDir: z.string().min(1),
  appOutDir: z.string().min(1).default('apps/web/out')
})

const githubPagesRepoSyncSchema = z.object({
  branch: z.string().min(1).default('main'),
  preserve: z.array(z.string().min(1)).default(['.github/workflows/deploy.yml', 'CNAME']),
  repoUrl: z.string().url(),
  strategy: z.literal('github-pages-repo-sync')
})

const siteDefinitionSchema = z.object({
  build: buildSchema,
  deploy: githubPagesRepoSyncSchema.optional(),
  id: z.string().min(1),
  site: siteSurfaceSchema,
  source: z.union([websiteJsonSourceSchema, trialProductsSourceSchema])
})

export type SiteDefinition = z.infer<typeof siteDefinitionSchema>
export type SiteSourcePlan = z.infer<typeof websiteJsonSourceSchema> | z.infer<typeof trialProductsSourceSchema>
export { siteDefinitionSchema }

const workspaceRoot = resolve(process.cwd())

export function resolveSiteDefinitionPath(siteId: string): string {
  return resolve(workspaceRoot, 'records', 'site-definitions', `${siteId}.json`)
}

export function loadSiteDefinition(siteId: string): SiteDefinition {
  const definitionPath = resolveSiteDefinitionPath(siteId)
  const raw = JSON.parse(readFileSync(definitionPath, 'utf8')) as unknown

  return siteDefinitionSchema.parse(raw)
}

export function resolveSiteArtifactDir(definition: SiteDefinition): string {
  return resolve(workspaceRoot, definition.build.artifactDir)
}

export function resolveSiteAppOutDir(definition: SiteDefinition): string {
  return resolve(workspaceRoot, definition.build.appOutDir)
}

export function resolveSiteSourcePlan(definition: SiteDefinition): SiteSourcePlan {
  return definition.source
}

export function buildSiteEnvironment(definition: SiteDefinition): Record<string, string> {
  const publicUrl = definition.site.publicUrl || `https://${definition.site.domain}`

  return {
    NEXT_PUBLIC_APP_URL: publicUrl,
    SITE_DESCRIPTION: definition.site.description,
    SITE_DOMAIN: definition.site.domain,
    SITE_DR_BADGE_ALT: definition.site.drBadge.alt,
    SITE_DR_BADGE_HEIGHT: String(definition.site.drBadge.height),
    SITE_DR_BADGE_HREF: definition.site.drBadge.href,
    SITE_DR_BADGE_IMAGE_SRC: definition.site.drBadge.imageSrc,
    SITE_DR_BADGE_WIDTH: String(definition.site.drBadge.width),
    SITE_GITHUB_ISSUES_URL: definition.site.githubIssuesUrl,
    SITE_GITHUB_ISSUE_OWNER: definition.site.githubIssueOwner,
    SITE_GITHUB_ISSUE_REPO: definition.site.githubIssueRepo,
    SITE_GITHUB_ISSUE_TEMPLATE: definition.site.githubIssueTemplate,
    SITE_GITHUB_REPO_URL: definition.site.githubRepoUrl,
    SITE_GITHUB_URL: definition.site.githubUrl,
    SITE_ID: definition.id,
    SITE_NAME: definition.site.name,
    SITE_REDDIT_URL: definition.site.redditUrl,
    SITE_SHOW_CREATOR_PROJECTS: String(definition.site.features.showCreatorProjects),
    SITE_SHOW_DEVELOPER_TOOLS: String(definition.site.features.showDeveloperTools),
    SITE_SHOW_FEATURED_GUIDES: String(definition.site.features.showFeaturedGuides),
    SITE_SHOW_NEWSLETTER: String(definition.site.features.showNewsletter),
    SITE_TAGLINE: definition.site.tagline,
    SITE_TWITTER_URL: definition.site.twitterUrl
  }
}
