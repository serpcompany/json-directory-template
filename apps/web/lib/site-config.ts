export type SiteDrBadge = {
  href: string
  imageSrc: string
  alt: string
  width: number
  height: number
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
  name: 'SERP',
  domain: 'serp.co',
  description:
    'Find the best products for building & growing abusiness online.',
  tagline: 'Discover AI-Ready Documentation',
  githubUrl: 'https://github.com/devinschumacher',
  githubRepoUrl: 'https://github.com/serpcompany/',
  githubIssueOwner: 'devinschumacher',
  githubIssueRepo: 'devinschumacher',
  githubIssuesUrl: 'https://github.com/serpapps/j/issues/new/choose',
  githubIssueTemplate: 'submit-website.yml',
  redditUrl: 'https://www.reddit.com/user/devinschumacher/',
  twitterUrl: 'https://x.com/dvnschmchr',
  drBadge: {
    href: 'https://dr.serp.co/',
    imageSrc: 'https://dr.serp.co/badge/serp.co?style=serp-dr-v3',
    alt: 'Verified DR 78 for serp.co',
    width: 200,
    height: 50
  }
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
    }
  }
}

export const siteConfig: SiteConfig = resolveSiteConfig()
