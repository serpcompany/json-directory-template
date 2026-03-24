export type SiteDrBadge = {
  href: string
  imageSrc: string
  alt: string
  width: number
  height: number
}

export type SiteFeatureFlags = {
  showCreatorProjects: boolean
  showDeveloperTools: boolean
  showFeaturedGuides: boolean
  showNewsletter: boolean
}

export type SiteConfig = {
  name: string
  domain: string
  description: string
  tagline: string
  githubUrl: string
  githubRepoUrl: string
  githubIssueOwner: string
  githubIssueRepo: string
  githubIssuesUrl: string
  githubIssueTemplate: string
  redditUrl: string
  twitterUrl: string
  drBadge: SiteDrBadge
  features: SiteFeatureFlags
}

type SiteConfigEnv = Partial<Record<string, string | undefined>>

export function getTwitterHandleFromUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url)
    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean)
    const handle = pathSegments.at(-1)

    if (!handle) {
      return null
    }

    return `@${handle}`
  } catch {
    return null
  }
}

const defaultSiteConfig: SiteConfig = {
  name: 'Directory Starter',
  domain: 'example.com',
  description: 'Curated directory of websites, tools, and resources.',
  tagline: 'Discover websites, tools, and resources',
  githubUrl: 'https://github.com/serpcompany',
  githubRepoUrl: 'https://github.com/serpcompany/json-directory-template',
  githubIssueOwner: 'serpcompany',
  githubIssueRepo: 'json-directory-template',
  githubIssuesUrl: 'https://github.com/serpcompany/json-directory-template/issues/new/choose',
  githubIssueTemplate: 'submit-website.yml',
  redditUrl: 'https://www.reddit.com/r/webdev/',
  twitterUrl: 'https://x.com/serpcompany',
  drBadge: {
    href: 'https://dr.serp.co/',
    imageSrc: 'https://dr.serp.co/badge/example.com?style=serp-dr-v3',
    alt: 'Verified DR badge for example.com',
    width: 200,
    height: 50
  },
  features: {
    showCreatorProjects: false,
    showDeveloperTools: false,
    showFeaturedGuides: false,
    showNewsletter: true
  }
}

function parseBooleanEnv(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback
  }

  return value === 'true'
}

export function resolveSiteConfig(env: SiteConfigEnv = process.env): SiteConfig {
  const domain = env.SITE_DOMAIN || defaultSiteConfig.domain
  const name = env.SITE_NAME || defaultSiteConfig.name
  const tagline = env.SITE_TAGLINE || defaultSiteConfig.tagline

  return {
    name,
    domain,
    description: env.SITE_DESCRIPTION || defaultSiteConfig.description,
    tagline,
    githubUrl: env.SITE_GITHUB_URL || defaultSiteConfig.githubUrl,
    githubRepoUrl: env.SITE_GITHUB_REPO_URL || defaultSiteConfig.githubRepoUrl,
    githubIssueOwner: env.SITE_GITHUB_ISSUE_OWNER || defaultSiteConfig.githubIssueOwner,
    githubIssueRepo: env.SITE_GITHUB_ISSUE_REPO || defaultSiteConfig.githubIssueRepo,
    githubIssuesUrl: env.SITE_GITHUB_ISSUES_URL || defaultSiteConfig.githubIssuesUrl,
    githubIssueTemplate: env.SITE_GITHUB_ISSUE_TEMPLATE || defaultSiteConfig.githubIssueTemplate,
    redditUrl: env.SITE_REDDIT_URL || defaultSiteConfig.redditUrl,
    twitterUrl: env.SITE_TWITTER_URL || defaultSiteConfig.twitterUrl,
    drBadge: {
      href: env.SITE_DR_BADGE_HREF || defaultSiteConfig.drBadge.href,
      imageSrc:
        env.SITE_DR_BADGE_IMAGE_SRC ||
        `https://dr.serp.co/badge/${domain}?style=serp-dr-v3`,
      alt: env.SITE_DR_BADGE_ALT || `Verified DR badge for ${domain}`,
      width: Number(env.SITE_DR_BADGE_WIDTH || defaultSiteConfig.drBadge.width),
      height: Number(env.SITE_DR_BADGE_HEIGHT || defaultSiteConfig.drBadge.height)
    },
    features: {
      showCreatorProjects: parseBooleanEnv(
        env.SITE_SHOW_CREATOR_PROJECTS,
        defaultSiteConfig.features.showCreatorProjects
      ),
      showDeveloperTools: parseBooleanEnv(
        env.SITE_SHOW_DEVELOPER_TOOLS,
        defaultSiteConfig.features.showDeveloperTools
      ),
      showFeaturedGuides: parseBooleanEnv(
        env.SITE_SHOW_FEATURED_GUIDES,
        defaultSiteConfig.features.showFeaturedGuides
      ),
      showNewsletter: parseBooleanEnv(
        env.SITE_SHOW_NEWSLETTER,
        defaultSiteConfig.features.showNewsletter
      )
    }
  }
}

export const siteConfig: SiteConfig = resolveSiteConfig()
